import { prisma } from "../lib/prisma.js";
import { config } from "../config.js";
import { writeLog } from "./auditLog.js";
import { fetchUnreadEmails } from "./imapIngest.js";
import { classifyEmail } from "./groqClassify.js";
import { matchTicket } from "./ticketMatch.js";
import { saveAttachmentsForNpi } from "./documents.js";
import { buildReplyHtml, sendReplyEmail } from "./brevoSend.js";

function routingFromConfidence(confidence) {
  if (confidence >= 80) return "auto";
  if (confidence >= 60) return "review";
  return "manual";
}

function fallbackClassification(summary) {
  return {
    actionable: false,
    category: "unknown",
    provider_name: null,
    npi: null,
    missing_docs: null,
    summary,
    confidence: 0,
  };
}

function trimForLog(value, max = 1200) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function isDuplicateMessageError(err) {
  return err?.code === "P2002";
}

async function sendAutoReply(emailRow, ticketMatched) {
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const html = buildReplyHtml({
        subject: emailRow.subject,
        summary: emailRow.summary,
        category: emailRow.category,
        providerName: emailRow.providerName,
        npi: emailRow.npi,
        ticketMatched,
      });
      const info = await sendReplyEmail({
        to: emailRow.sender,
        subject: `Re: ${emailRow.subject}`,
        htmlContent: html,
      });
      await prisma.email.update({
        where: { id: emailRow.id },
        data: {
          status: "auto_sent",
          sendAttempts: attempt,
          lastError: null,
        },
      });
      await writeLog({
        emailId: emailRow.id,
        message: `SMTP reply sent (attempt ${attempt}) messageId=${trimForLog(info?.messageId || "n/a", 250)}`,
        status: "success",
      });
      return true;
    } catch (err) {
      lastErr = err;
      await prisma.email.update({
        where: { id: emailRow.id },
        data: {
          sendAttempts: attempt,
          lastError: String(err?.message || err),
        },
      });
      await writeLog({
        emailId: emailRow.id,
        message: `SMTP reply failed (attempt ${attempt}): ${String(err?.message || err)}`,
        status: "warn",
      });
    }
  }
  await prisma.email.update({
    where: { id: emailRow.id },
    data: {
      status: "send_failed",
      lastError: String(lastErr?.message || lastErr || "unknown"),
    },
  });
  await writeLog({
    emailId: emailRow.id,
    message: "SMTP reply exhausted retries",
    status: "error",
  });
  return false;
}

export async function processIngestedEmail(item, options = {}) {
  const { source = "imap", forceSendForActionable = false } = options;

  await writeLog({
    message: `Ingested source=${source} message_id=${item.messageId} from=${item.sender}`,
    status: "ingestion",
  });

  let classification;
  try {
    const result = await classifyEmail({
      subject: item.subject,
      body: item.body,
      sender: item.sender,
    });
    classification = result.classification;
    await writeLog({
      message: `AI raw output message_id=${item.messageId}: ${trimForLog(result.raw)}`,
      status: "ai_raw",
    });
  } catch (err) {
    await writeLog({
      message: `Classification error message_id=${item.messageId}: ${String(err?.message || err)}`,
      status: "error",
    });
    if (err?.raw) {
      await writeLog({
        message: `AI raw output message_id=${item.messageId}: ${trimForLog(err.raw)}`,
        status: "ai_raw",
      });
    }
    classification = fallbackClassification("AI classification request failed");
  }

  if (!classification) {
    classification = fallbackClassification("AI returned invalid JSON");
  }

  const routingMode = routingFromConfidence(classification.confidence);
  const ticket = await matchTicket({
    npi: classification.npi,
    providerName: classification.provider_name,
  });

  await writeLog({
    message: `Routing decision message_id=${item.messageId} category=${classification.category} confidence=${classification.confidence} route=${routingMode} actionable=${classification.actionable} ticket=${ticket?.id ?? "none"}`,
    status: "classification",
  });

  const initialStatus =
    routingMode === "review"
      ? "review"
      : routingMode === "manual"
        ? "manual"
        : "pending_auto";

  let emailRow;
  try {
    emailRow = await prisma.email.create({
      data: {
        messageId: item.messageId,
        subject: item.subject,
        sender: item.sender,
        body: item.body,
        category: classification.category,
        providerName: classification.provider_name,
        npi: classification.npi,
        confidence: classification.confidence,
        actionable: classification.actionable,
        missingDocs: classification.missing_docs,
        summary: classification.summary,
        status: initialStatus,
        routingMode,
        ticketId: ticket?.id ?? null,
      },
    });
  } catch (err) {
    if (isDuplicateMessageError(err)) {
      const duplicate = await prisma.email.findUnique({
        where: { messageId: item.messageId },
      });
      await writeLog({
        emailId: duplicate?.id ?? null,
        message: `Duplicate prevented during create message_id=${item.messageId}`,
        status: "skipped",
      });
      return duplicate;
    }
    throw err;
  }

  await writeLog({
    emailId: emailRow.id,
    message: `Email stored; routing=${routingMode} ticket=${ticket?.id ?? "none"}`,
    status: "routing",
  });

  const savedPaths = await saveAttachmentsForNpi(
    classification.npi,
    item.attachments
  );
  if (savedPaths.length) {
    await writeLog({
      emailId: emailRow.id,
      message: `Saved ${savedPaths.length} attachment(s) under docs/`,
      status: "documents",
    });
  }

  if (routingMode === "auto" && classification.actionable) {
    await sendAutoReply(emailRow, Boolean(ticket));
  } else if (routingMode === "auto" && !classification.actionable) {
    await prisma.email.update({
      where: { id: emailRow.id },
      data: { status: "processed" },
    });
    await writeLog({
      emailId: emailRow.id,
      message: "Auto route: not actionable; no reply sent",
      status: "routing",
    });
  } else if (forceSendForActionable && classification.actionable) {
    await writeLog({
      emailId: emailRow.id,
      message: `Test flow forcing send from status=${emailRow.status}`,
      status: "routing",
    });
    await approveAndSend(emailRow.id);
  }

  return prisma.email.findUnique({
    where: { id: emailRow.id },
  });
}

export async function runPipeline() {
  const summary = { processed: 0, skipped: 0, failed: 0 };

  await writeLog({
    message: "Pipeline started (IMAP fetch)",
    status: "info",
  });

  let ingested;
  try {
    ingested = await fetchUnreadEmails();
  } catch (err) {
    await writeLog({
      message: `IMAP ingestion failed: ${String(err?.message || err)}`,
      status: "error",
    });
    summary.failed += 1;
    return summary;
  }

  await writeLog({
    message: `IMAP fetched ${ingested.length} unread message(s); disconnect complete`,
    status: "ingestion",
  });

  const queue = [];

  for (const item of ingested) {
    const exists = await prisma.email.findUnique({
      where: { messageId: item.messageId },
    });
    if (exists) {
      summary.skipped += 1;
      await writeLog({
        emailId: exists.id,
        message: `Duplicate skipped message_id=${item.messageId}`,
        status: "skipped",
      });
      continue;
    }
    queue.push(item);
  }

  for (const item of queue) {
    try {
      const processed = await processIngestedEmail(item);
      if (processed) {
        summary.processed += 1;
      } else {
        summary.skipped += 1;
      }
    } catch (err) {
      summary.failed += 1;
      await writeLog({
        message: `Processing failed message_id=${item.messageId}: ${String(err?.message || err)}`,
        status: "error",
      });
    }
  }

  await writeLog({
    message: `Pipeline finished ${JSON.stringify(summary)}`,
    status: "info",
  });

  return summary;
}

export async function runTestEmailFlow(text) {
  const body = String(text || "").trim();
  if (!body) {
    throw new Error("text is required");
  }

  return processIngestedEmail(
    {
      messageId: `test-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      subject: "Test Email Automation Request",
      sender: config.emailUser,
      body,
      attachments: [],
    },
    {
      source: "test-email",
      forceSendForActionable: true,
    }
  );
}

export async function approveAndSend(emailId) {
  const row = await prisma.email.findUnique({ where: { id: emailId } });
  if (!row) throw new Error("Email not found");
  if (!["review", "manual", "send_failed"].includes(row.status)) {
    throw new Error("Email is not in an approvable state");
  }

  const ticket = row.ticketId
    ? await prisma.ticket.findUnique({ where: { id: row.ticketId } })
    : await matchTicket({ npi: row.npi, providerName: row.providerName });

  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const html = buildReplyHtml({
        subject: row.subject,
        summary: row.summary,
        category: row.category,
        providerName: row.providerName,
        npi: row.npi,
        ticketMatched: Boolean(ticket),
      });
      const info = await sendReplyEmail({
        to: row.sender,
        subject: `Re: ${row.subject}`,
        htmlContent: html,
      });
      await prisma.email.update({
        where: { id: row.id },
        data: {
          status: "approved",
          sendAttempts: attempt,
          lastError: null,
          ticketId: ticket?.id ?? row.ticketId,
        },
      });
      await writeLog({
        emailId: row.id,
        message: `Manual approval sent via SMTP (attempt ${attempt}) messageId=${trimForLog(info?.messageId || "n/a", 250)}`,
        status: "success",
      });
      return prisma.email.findUnique({ where: { id: row.id } });
    } catch (err) {
      lastErr = err;
      await prisma.email.update({
        where: { id: row.id },
        data: {
          sendAttempts: attempt,
          lastError: String(err?.message || err),
        },
      });
      await writeLog({
        emailId: row.id,
        message: `Approval send failed (attempt ${attempt}): ${String(err?.message || err)}`,
        status: "warn",
      });
    }
  }

  await prisma.email.update({
    where: { id: row.id },
    data: {
      status: "send_failed",
      lastError: String(lastErr?.message || lastErr || "unknown"),
    },
  });
  throw lastErr;
}

export async function rejectEmail(emailId) {
  const row = await prisma.email.findUnique({ where: { id: emailId } });
  if (!row) throw new Error("Email not found");
  await prisma.email.update({
    where: { id: emailId },
    data: { status: "rejected" },
  });
  await writeLog({
    emailId,
    message: "Email rejected in review dashboard",
    status: "rejected",
  });
  return row;
}

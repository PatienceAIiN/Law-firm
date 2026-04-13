import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { config } from "../config.js";
import { writeLog } from "./auditLog.js";

function normalizeMessageId(id) {
  if (!id) return null;
  return String(id).replace(/^<|>$/g, "").trim();
}

function previewError(err) {
  return String(err?.message || err || "unknown error").slice(0, 500);
}

async function withTimeout(promise, ms, label, onTimeout) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          try {
            onTimeout?.();
          } catch {
            /* ignore */
          }
          reject(new Error(`${label} timed out after ${ms}ms`));
        }, ms);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchUnreadEmails() {
  const client = new ImapFlow({
    host: config.imapHost,
    port: config.imapPort,
    secure: config.imapPort === 993,
    auth: {
      user: config.emailUser,
      pass: config.emailPass,
    },
    logger: false,
    connectionTimeout: 45_000,
    socketTimeout: 120_000,
  });

  const results = [];

  try {
    await writeLog({
      message: `IMAP connect start host=${config.imapHost}:${config.imapPort}`,
      status: "imap",
    });
    await withTimeout(client.connect(), 45_000, "IMAP connect", () => {
      client.close();
    });
    await writeLog({
      message: "IMAP connect success",
      status: "imap",
    });
  } catch (err) {
    try {
      client.close();
    } catch {
      /* ignore */
    }
    await writeLog({
      message: `IMAP connect failure: ${previewError(err)}`,
      status: "error",
    });
    throw err;
  }

  const lock = await withTimeout(
    client.getMailboxLock("INBOX"),
    30_000,
    "IMAP mailbox lock",
    () => {
      client.close();
    }
  );

  try {
    const uids = await withTimeout(
      client.search({ seen: false }),
      30_000,
      "IMAP search",
      () => {
        client.close();
      }
    );
    const selectedUids =
      config.imapMaxFetch > 0 ? uids.slice(-config.imapMaxFetch) : uids;

    await writeLog({
      message: `IMAP unread count=${uids.length}; selected=${selectedUids.length}`,
      status: "imap",
    });

    if (selectedUids.length < uids.length) {
      await writeLog({
        message: `IMAP batch limited to latest ${selectedUids.length} unread message(s)`,
        status: "imap",
      });
    }

    for (const uid of selectedUids) {
      const fetched = await withTimeout(
        client.fetchOne(
          uid,
          {
            source: true,
            envelope: true,
            uid: true,
          },
          { uid: true }
        ),
        60_000,
        `IMAP fetch uid=${uid}`,
        () => {
          client.close();
        }
      );

      if (!fetched?.source) continue;

      const parsed = await simpleParser(fetched.source);

      const messageId =
        normalizeMessageId(parsed.messageId) ||
        `generated-${uid}-${Date.now()}`;

      const sender =
        parsed.from?.value?.[0]?.address ||
        parsed.from?.text ||
        "unknown@unknown";

      const subject = parsed.subject || "(no subject)";
      const body =
        parsed.text ||
        (typeof parsed.html === "string"
          ? parsed.html.replace(/<[^>]+>/g, " ")
          : "") ||
        "";

      const attachments = [];
      for (const att of parsed.attachments || []) {
        if (!att.filename || !att.content) continue;
        attachments.push({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType || "application/octet-stream",
        });
      }

      results.push({
        imapUid: uid,
        messageId,
        subject,
        sender,
        body,
        attachments,
      });

      await withTimeout(
        client.messageFlagsAdd(uid, ["\\Seen"], { uid: true }),
        15_000,
        `IMAP mark seen uid=${uid}`,
        () => {
          client.close();
        }
      );
    }
  } finally {
    lock.release();
  }

  try {
    await withTimeout(client.logout(), 15_000, "IMAP logout", () => {
      client.close();
    });
  } catch {
    try {
      client.close();
    } catch {
      /* ignore */
    }
  }

  await writeLog({
    message: "IMAP disconnect success",
    status: "imap",
  });

  return results;
}

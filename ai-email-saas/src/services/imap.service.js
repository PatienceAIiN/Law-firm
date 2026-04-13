import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { config } from "../config.js";
import { logStep } from "./logger.service.js";

/**
 * Connect, fetch unread, mark read, disconnect. No persistent connection.
 * @returns {Promise<Array<{
 *   messageId: string,
 *   subject: string,
 *   sender: string,
 *   body: string,
 *   attachments: Array<{ filename: string, content: Buffer, contentType: string }>
 * }>>}
 */
export async function fetchUnreadEmailsOnce() {
  const client = new ImapFlow({
    host: config.imapHost,
    port: config.imapPort,
    secure: config.imapPort === 993,
    auth: {
      user: config.emailUser,
      pass: config.emailPass,
    },
    logger: false,
  });

  const results = [];

  await logStep(null, "IMAP: connecting", "info");
  await client.connect();

  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      const uids = await client.search({ seen: false });
      await logStep(null, `IMAP: found ${uids.length} unread message(s)`, "info");

      for (const uid of uids) {
        const fetched = await client.fetchOne(uid, { source: true, envelope: true }, { uid: true });
        if (!fetched?.source) continue;

        const parsed = await simpleParser(fetched.source);
        const messageId =
          parsed.messageId?.replace(/[<>]/g, "") ||
          `generated-${uid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

        const sender =
          parsed.from?.value?.[0]?.address ||
          parsed.from?.text ||
          "unknown@unknown";

        const subject = parsed.subject || "(no subject)";
        const body =
          parsed.text?.trim() ||
          (typeof parsed.html === "string" ? stripHtml(parsed.html) : "") ||
          "";

        const attachments = (parsed.attachments || []).map((a) => ({
          filename: a.filename || "attachment",
          content: a.content,
          contentType: a.contentType || "application/octet-stream",
        }));

        await client.messageFlagsAdd(uid, ["\\Seen"], { uid: true });

        results.push({
          messageId,
          subject,
          sender,
          body,
          attachments,
        });
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
    await logStep(null, "IMAP: disconnected", "info");
  }

  return results;
}

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

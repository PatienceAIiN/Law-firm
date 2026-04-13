import nodemailer from "nodemailer";
import { config } from "../config.js";

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildTransport() {
  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: {
      user: config.emailUser,
      pass: config.emailPass,
    },
    logger: true,
    debug: true,
  });
}

export function buildReplyHtml({
  subject,
  summary,
  category,
  providerName,
  npi,
  ticketMatched,
}) {
  const safe = {
    subject: escapeHtml(subject),
    summary: escapeHtml(summary || ""),
    category: escapeHtml(category || ""),
    provider: escapeHtml(providerName || "-"),
    npi: escapeHtml(npi || "-"),
    ticket: ticketMatched ? "Matched to existing ticket." : "No ticket match.",
  };
  return `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111827">
  <h2 style="margin:0 0 12px">We received your message</h2>
  <p style="margin:0 0 8px"><strong>Subject:</strong> ${safe.subject}</p>
  <p style="margin:0 0 8px"><strong>Category:</strong> ${safe.category}</p>
  <p style="margin:0 0 8px"><strong>Provider:</strong> ${safe.provider} &nbsp;|&nbsp; <strong>NPI:</strong> ${safe.npi}</p>
  <p style="margin:0 0 8px">${safe.ticket}</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
  <p style="margin:0"><strong>Summary</strong></p>
  <p style="margin:8px 0 0">${safe.summary}</p>
  <p style="margin:24px 0 0;font-size:12px;color:#6b7280">This is an automated acknowledgment from your operations team.</p>
</body></html>`;
}

export async function sendReplyEmail({ to, subject, htmlContent }) {
  const transporter = buildTransport();
  try {
    return await transporter.sendMail({
      from: config.emailUser,
      replyTo:
        config.emailFrom && config.emailFrom !== config.emailUser
          ? config.emailFrom
          : undefined,
      to,
      subject,
      html: htmlContent,
    });
  } finally {
    transporter.close();
  }
}

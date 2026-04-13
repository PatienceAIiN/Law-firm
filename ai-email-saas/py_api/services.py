from __future__ import annotations

import imaplib
import json
import re
import smtplib
import uuid
from dataclasses import dataclass
from datetime import datetime
from email import message_from_bytes
from email.message import EmailMessage, Message
from pathlib import Path
from typing import Any

import httpx
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .config import settings
from .models import EmailRecord, LogRecord, Ticket


GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
SYSTEM_PROMPT = """You are an enterprise healthcare operations assistant. Analyze the email and respond with ONLY a single JSON object (no markdown fences) with these keys:
- actionable: boolean
- category: string (credentialing, claims, prior_auth, billing, other)
- provider_name: string or null
- npi: string or null (10 digits if known, else null)
- missing_docs: string or null
- summary: string
- confidence: integer 0-100
Rules:
- confidence reflects how sure you are about category, provider, and next action
- npi must be null unless a clear 10-digit NPI appears
- missing_docs lists missing paperwork if any, else null
- summary should be 1-3 sentences"""


@dataclass
class IngestedEmail:
    message_id: str
    subject: str
    sender: str
    body: str
    attachments: list[dict[str, Any]]


def cuid() -> str:
    return uuid.uuid4().hex


def strip_html(html: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html or "")).strip()


def sanitize_segment(value: str | None) -> str:
    return re.sub(r"[^a-zA-Z0-9._-]", "_", value or "unknown")[:64] or "unknown"


def trim_for_log(value: str | None, max_len: int = 1200) -> str:
    return re.sub(r"\s+", " ", value or "").strip()[:max_len]


def routing_from_confidence(confidence: int) -> str:
    if confidence >= 80:
        return "auto"
    if confidence >= 60:
        return "review"
    return "manual"


def email_to_dict(row: EmailRecord) -> dict[str, Any]:
    return {
        "id": row.id,
        "messageId": row.message_id,
        "subject": row.subject,
        "sender": row.sender,
        "body": row.body,
        "category": row.category,
        "providerName": row.provider_name,
        "npi": row.npi,
        "confidence": row.confidence,
        "actionable": row.actionable,
        "missingDocs": row.missing_docs,
        "summary": row.summary,
        "status": row.status,
        "routingMode": row.routing_mode,
        "ticketId": row.ticket_id,
        "sendAttempts": row.send_attempts,
        "lastError": row.last_error,
        "createdAt": row.created_at.isoformat() if row.created_at else None,
    }


def log_to_dict(row: LogRecord) -> dict[str, Any]:
    return {
        "id": row.id,
        "emailId": row.email_id,
        "message": row.message,
        "status": row.status,
        "createdAt": row.created_at.isoformat() if row.created_at else None,
    }


def write_log(session: Session, message: str, status: str, email_id: str | None = None) -> LogRecord:
    row = LogRecord(
        id=cuid(),
        email_id=email_id,
        message=message,
        status=status,
    )
    session.add(row)
    session.flush()
    return row


def parse_classification_json(raw: str) -> dict[str, Any]:
    text = (raw or "").strip()
    fenced = re.search(r"```(?:json)?\s*([\s\S]*?)```", text, flags=re.IGNORECASE)
    if fenced:
        text = fenced.group(1).strip()

    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise ValueError("Invalid JSON from Groq classifier") from None
        parsed = json.loads(text[start : end + 1])

    confidence = max(0, min(100, int(parsed.get("confidence", 0) or 0)))
    npi = parsed.get("npi")
    npi = re.sub(r"\D", "", str(npi)) if npi not in (None, "") else None
    if npi and len(npi) != 10:
        npi = None

    return {
        "actionable": bool(parsed.get("actionable")),
        "category": str(parsed.get("category") or "other"),
        "provider_name": None if parsed.get("provider_name") in (None, "") else str(parsed.get("provider_name")),
        "npi": npi,
        "missing_docs": None if parsed.get("missing_docs") in (None, "") else str(parsed.get("missing_docs")),
        "summary": str(parsed.get("summary") or "")[:2000],
        "confidence": confidence,
    }


def classify_email(subject: str, body: str, sender: str) -> dict[str, Any]:
    payload = {
        "model": settings.groq_model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"From: {sender}\nSubject: {subject}\n\n{body[:12000]}"},
        ],
        "temperature": 0.2,
        "max_tokens": 1024,
    }
    with httpx.Client(timeout=60) as client:
        response = client.post(
            GROQ_URL,
            headers={
                "Authorization": f"Bearer {settings.groq_api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        response.raise_for_status()
        raw = str(response.json().get("choices", [{}])[0].get("message", {}).get("content", "")).strip()
    if not raw:
        raise ValueError("Empty response from Groq classifier")
    return {"raw": raw, "classification": parse_classification_json(raw)}


def _message_body(msg: Message) -> str:
    plain_parts: list[str] = []
    html_parts: list[str] = []

    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_maintype() == "multipart":
                continue
            if part.get_filename():
                continue
            payload = part.get_payload(decode=True) or b""
            charset = part.get_content_charset() or "utf-8"
            text = payload.decode(charset, errors="replace").strip()
            if not text:
                continue
            if part.get_content_type() == "text/plain":
                plain_parts.append(text)
            elif part.get_content_type() == "text/html":
                html_parts.append(strip_html(text))
    else:
        payload = msg.get_payload(decode=True) or b""
        charset = msg.get_content_charset() or "utf-8"
        text = payload.decode(charset, errors="replace").strip()
        if msg.get_content_type() == "text/html":
            html_parts.append(strip_html(text))
        else:
            plain_parts.append(text)

    return "\n".join(part for part in plain_parts if part).strip() or "\n".join(
        part for part in html_parts if part
    ).strip()


def fetch_unread_emails(session: Session) -> list[IngestedEmail]:
    write_log(session, f"IMAP connect start host={settings.imap_host}:{settings.imap_port}", "imap")
    mailbox = imaplib.IMAP4_SSL(settings.imap_host, settings.imap_port, timeout=45)
    try:
        mailbox.login(settings.email_user, settings.email_pass)
        write_log(session, "IMAP connect success", "imap")
        status, _ = mailbox.select("INBOX")
        if status != "OK":
            raise RuntimeError("Unable to select INBOX")
        status, data = mailbox.search(None, "UNSEEN")
        if status != "OK":
            raise RuntimeError("IMAP search failed")
        message_numbers = [item for item in (data[0] or b"").split() if item]
        selected = message_numbers[-settings.imap_max_fetch :] if settings.imap_max_fetch > 0 else message_numbers
        write_log(session, f"IMAP unread count={len(message_numbers)}; selected={len(selected)}", "imap")
        if len(selected) < len(message_numbers):
            write_log(session, f"IMAP batch limited to latest {len(selected)} unread message(s)", "imap")

        results: list[IngestedEmail] = []
        for num in selected:
            status, payload = mailbox.fetch(num, "(RFC822)")
            if status != "OK" or not payload:
                continue
            raw_bytes = b"".join(
                chunk[1] for chunk in payload if isinstance(chunk, tuple) and len(chunk) > 1 and chunk[1]
            )
            if not raw_bytes:
                continue
            parsed = message_from_bytes(raw_bytes)
            message_id = (parsed.get("Message-ID") or "").strip().strip("<>").strip() or f"generated-{num.decode()}-{int(datetime.utcnow().timestamp())}"
            sender = parsed.get("From") or "unknown@unknown"
            subject = parsed.get("Subject") or "(no subject)"
            body = _message_body(parsed)
            attachments: list[dict[str, Any]] = []
            for part in parsed.walk():
                filename = part.get_filename()
                if not filename:
                    continue
                content = part.get_payload(decode=True)
                if not content:
                    continue
                attachments.append(
                    {
                        "filename": filename,
                        "content": content,
                        "content_type": part.get_content_type() or "application/octet-stream",
                    }
                )
            mailbox.store(num, "+FLAGS", "\\Seen")
            results.append(
                IngestedEmail(
                    message_id=message_id,
                    subject=subject,
                    sender=sender,
                    body=body,
                    attachments=attachments,
                )
            )
    finally:
        try:
            mailbox.logout()
        except Exception:
            pass
        write_log(session, "IMAP disconnect success", "imap")

    return results


def match_ticket(session: Session, npi: str | None, provider_name: str | None) -> Ticket | None:
    if npi and len(npi) == 10:
        ticket = session.scalar(select(Ticket).where(Ticket.npi == npi).limit(1))
        if ticket:
            return ticket
    if provider_name:
        ticket = session.scalar(
            select(Ticket).where(func.lower(Ticket.provider_name) == provider_name.strip().lower()).limit(1)
        )
        if ticket:
            return ticket
    return None


def save_attachments(npi: str | None, attachments: list[dict[str, Any]]) -> list[str]:
    folder = sanitize_segment(npi or "unknown")
    target_dir = settings.docs_root / folder
    target_dir.mkdir(parents=True, exist_ok=True)
    saved: list[str] = []
    for attachment in attachments:
        name = sanitize_segment(str(attachment.get("filename") or "attachment"))
        path = target_dir / f"{int(datetime.utcnow().timestamp() * 1000)}_{name}"
        Path(path).write_bytes(attachment["content"])
        saved.append(str(path))
    return saved


def build_reply_html(subject: str, summary: str | None, category: str | None, provider_name: str | None, npi: str | None, ticket_matched: bool) -> str:
    def esc(value: str | None, default: str = "-") -> str:
        text = (value or default).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")
        return text

    return f"""<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111827">
  <h2 style="margin:0 0 12px">We received your message</h2>
  <p style="margin:0 0 8px"><strong>Subject:</strong> {esc(subject)}</p>
  <p style="margin:0 0 8px"><strong>Category:</strong> {esc(category)}</p>
  <p style="margin:0 0 8px"><strong>Provider:</strong> {esc(provider_name)} &nbsp;|&nbsp; <strong>NPI:</strong> {esc(npi)}</p>
  <p style="margin:0 0 8px">{'Matched to existing ticket.' if ticket_matched else 'No ticket match.'}</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
  <p style="margin:0"><strong>Summary</strong></p>
  <p style="margin:8px 0 0">{esc(summary, '')}</p>
  <p style="margin:24px 0 0;font-size:12px;color:#6b7280">This is an automated acknowledgment from your operations team.</p>
</body></html>"""


def send_reply_email(to_email: str, subject: str, html_content: str) -> str:
    message = EmailMessage()
    message["From"] = settings.email_user
    message["To"] = to_email
    message["Subject"] = subject
    if settings.email_from and settings.email_from != settings.email_user:
        message["Reply-To"] = settings.email_from
    message.set_content("This email requires an HTML-capable client.")
    message.add_alternative(html_content, subtype="html")

    with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=30) as smtp:
        smtp.set_debuglevel(1)
        smtp.login(settings.email_user, settings.email_pass)
        response = smtp.send_message(message)
    return "sent" if not response else json.dumps(response)


def fallback_classification(summary: str) -> dict[str, Any]:
    return {
        "actionable": False,
        "category": "unknown",
        "provider_name": None,
        "npi": None,
        "missing_docs": None,
        "summary": summary,
        "confidence": 0,
    }


def send_with_retries(session: Session, row: EmailRecord, ticket_matched: bool, status_on_success: str) -> EmailRecord:
    last_error: str | None = None
    for attempt in range(1, 4):
        try:
            html = build_reply_html(
                row.subject,
                row.summary,
                row.category,
                row.provider_name,
                row.npi,
                ticket_matched,
            )
            message_id = send_reply_email(row.sender, f"Re: {row.subject}", html)
            row.status = status_on_success
            row.send_attempts = attempt
            row.last_error = None
            session.flush()
            write_log(session, f"SMTP reply sent (attempt {attempt}) messageId={trim_for_log(message_id, 250)}", "success", row.id)
            return row
        except Exception as exc:
            last_error = str(exc)
            row.send_attempts = attempt
            row.last_error = last_error
            session.flush()
            write_log(session, f"SMTP reply failed (attempt {attempt}): {last_error}", "warn", row.id)
    row.status = "send_failed"
    row.last_error = last_error
    session.flush()
    write_log(session, "SMTP reply exhausted retries", "error", row.id)
    return row


def process_ingested_email(session: Session, item: IngestedEmail, source: str = "imap", force_send_for_actionable: bool = False) -> EmailRecord:
    write_log(session, f"Ingested source={source} message_id={item.message_id} from={item.sender}", "ingestion")

    try:
        ai_result = classify_email(item.subject, item.body, item.sender)
        classification = ai_result["classification"]
        write_log(session, f"AI raw output message_id={item.message_id}: {trim_for_log(ai_result['raw'])}", "ai_raw")
    except Exception as exc:
        raw = getattr(exc, "raw", None)
        write_log(session, f"Classification error message_id={item.message_id}: {exc}", "error")
        if raw:
            write_log(session, f"AI raw output message_id={item.message_id}: {trim_for_log(raw)}", "ai_raw")
        classification = fallback_classification("AI classification request failed")

    routing_mode = routing_from_confidence(int(classification["confidence"]))
    ticket = match_ticket(session, classification["npi"], classification["provider_name"])
    write_log(
        session,
        f"Routing decision message_id={item.message_id} category={classification['category']} confidence={classification['confidence']} route={routing_mode} actionable={classification['actionable']} ticket={ticket.id if ticket else 'none'}",
        "classification",
    )

    initial_status = "pending_auto"
    if routing_mode == "review":
        initial_status = "review"
    elif routing_mode == "manual":
        initial_status = "manual"

    row = EmailRecord(
        id=cuid(),
        message_id=item.message_id,
        subject=item.subject,
        sender=item.sender,
        body=item.body,
        category=classification["category"],
        provider_name=classification["provider_name"],
        npi=classification["npi"],
        confidence=classification["confidence"],
        actionable=classification["actionable"],
        missing_docs=classification["missing_docs"],
        summary=classification["summary"],
        status=initial_status,
        routing_mode=routing_mode,
        ticket_id=ticket.id if ticket else None,
        send_attempts=0,
    )
    session.add(row)
    try:
        session.flush()
    except IntegrityError:
        session.rollback()
        existing = session.scalar(select(EmailRecord).where(EmailRecord.message_id == item.message_id).limit(1))
        if existing:
            write_log(session, f"Duplicate prevented during create message_id={item.message_id}", "skipped", existing.id)
            return existing
        raise

    write_log(session, f"Email stored; routing={routing_mode} ticket={ticket.id if ticket else 'none'}", "routing", row.id)

    saved_paths = save_attachments(classification["npi"], item.attachments)
    if saved_paths:
        write_log(session, f"Saved {len(saved_paths)} attachment(s) under docs/", "documents", row.id)

    if routing_mode == "auto" and classification["actionable"]:
        row = send_with_retries(session, row, bool(ticket), "auto_sent")
    elif routing_mode == "auto":
        row.status = "processed"
        session.flush()
        write_log(session, "Auto route: not actionable; no reply sent", "routing", row.id)
    elif force_send_for_actionable and classification["actionable"]:
        write_log(session, f"Test flow forcing send from status={row.status}", "routing", row.id)
        row = approve_and_send(session, row.id)

    session.flush()
    return row


def run_pipeline(session: Session) -> dict[str, int]:
    summary = {"processed": 0, "skipped": 0, "failed": 0}
    write_log(session, "Pipeline started (IMAP fetch)", "info")
    try:
        ingested = fetch_unread_emails(session)
    except Exception as exc:
        write_log(session, f"IMAP ingestion failed: {exc}", "error")
        summary["failed"] += 1
        return summary

    write_log(session, f"IMAP fetched {len(ingested)} unread message(s); disconnect complete", "ingestion")

    queue: list[IngestedEmail] = []
    for item in ingested:
        existing = session.scalar(select(EmailRecord).where(EmailRecord.message_id == item.message_id).limit(1))
        if existing:
            summary["skipped"] += 1
            write_log(session, f"Duplicate skipped message_id={item.message_id}", "skipped", existing.id)
            continue
        queue.append(item)

    for item in queue:
        try:
            row = process_ingested_email(session, item)
            if row:
                summary["processed"] += 1
            else:
                summary["skipped"] += 1
        except Exception as exc:
            summary["failed"] += 1
            write_log(session, f"Processing failed message_id={item.message_id}: {exc}", "error")

    write_log(session, f"Pipeline finished {json.dumps(summary)}", "info")
    return summary


def run_test_email_flow(session: Session, text: str) -> EmailRecord:
    body = text.strip()
    if not body:
        raise ValueError("text is required")
    item = IngestedEmail(
        message_id=f"test-{int(datetime.utcnow().timestamp() * 1000)}-{uuid.uuid4().hex[:8]}",
        subject="Test Email Automation Request",
        sender=settings.email_user,
        body=body,
        attachments=[],
    )
    return process_ingested_email(session, item, source="test-email", force_send_for_actionable=True)


def approve_and_send(session: Session, email_id: str) -> EmailRecord:
    row = session.get(EmailRecord, email_id)
    if not row:
        raise ValueError("Email not found")
    if row.status not in {"review", "manual", "send_failed"}:
        raise ValueError("Email is not in an approvable state")
    ticket = session.get(Ticket, row.ticket_id) if row.ticket_id else match_ticket(session, row.npi, row.provider_name)
    row = send_with_retries(session, row, bool(ticket), "approved")
    if ticket and not row.ticket_id:
        row.ticket_id = ticket.id
        session.flush()
    return row


def reject_email(session: Session, email_id: str) -> EmailRecord:
    row = session.get(EmailRecord, email_id)
    if not row:
        raise ValueError("Email not found")
    row.status = "rejected"
    session.flush()
    write_log(session, "Email rejected in review dashboard", "rejected", row.id)
    return row


def list_emails(session: Session, status: str | None, query: str | None, category: str | None, limit: int) -> list[EmailRecord]:
    stmt = select(EmailRecord)
    if status:
        stmt = stmt.where(EmailRecord.status == status)
    if category:
        stmt = stmt.where(EmailRecord.category.ilike(f"%{category}%"))
    if query:
        term = f"%{query.strip()}%"
        stmt = stmt.where(
            or_(
                EmailRecord.subject.ilike(term),
                EmailRecord.sender.ilike(term),
                EmailRecord.body.ilike(term),
                EmailRecord.provider_name.ilike(term),
                EmailRecord.npi.ilike(term),
            )
        )
    stmt = stmt.order_by(EmailRecord.created_at.desc()).limit(limit)
    return list(session.scalars(stmt).all())


def review_queue(session: Session) -> list[EmailRecord]:
    stmt = (
        select(EmailRecord)
        .where(EmailRecord.status.in_(["review", "manual"]))
        .order_by(EmailRecord.created_at.desc())
        .limit(200)
    )
    return list(session.scalars(stmt).all())


def list_logs(session: Session, limit: int) -> list[LogRecord]:
    stmt = select(LogRecord).order_by(LogRecord.created_at.desc()).limit(limit)
    return list(session.scalars(stmt).all())


def stats(session: Session) -> dict[str, int]:
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    total = session.scalar(select(func.count()).select_from(EmailRecord)) or 0
    review = session.scalar(select(func.count()).select_from(EmailRecord).where(EmailRecord.status == "review")) or 0
    manual = session.scalar(select(func.count()).select_from(EmailRecord).where(EmailRecord.status == "manual")) or 0
    auto_sent = session.scalar(select(func.count()).select_from(EmailRecord).where(EmailRecord.status == "auto_sent")) or 0
    failed = session.scalar(select(func.count()).select_from(EmailRecord).where(EmailRecord.status == "send_failed")) or 0
    today_count = session.scalar(select(func.count()).select_from(EmailRecord).where(EmailRecord.created_at >= today)) or 0
    return {
        "totalEmails": int(total),
        "inReview": int(review + manual),
        "autoSent": int(auto_sent),
        "sendFailed": int(failed),
        "ingestedToday": int(today_count),
    }

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class EmailRecord(Base):
    __tablename__ = "emails"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    message_id: Mapped[str] = mapped_column("message_id", String, unique=True, nullable=False)
    subject: Mapped[str] = mapped_column(String, nullable=False)
    sender: Mapped[str] = mapped_column(String, nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str | None] = mapped_column(String)
    provider_name: Mapped[str | None] = mapped_column("provider_name", String)
    npi: Mapped[str | None] = mapped_column(String)
    confidence: Mapped[int | None] = mapped_column(Integer)
    actionable: Mapped[bool | None] = mapped_column(Boolean, default=False)
    missing_docs: Mapped[str | None] = mapped_column("missing_docs", Text)
    summary: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String, default="pending")
    routing_mode: Mapped[str | None] = mapped_column("routing_mode", String)
    ticket_id: Mapped[str | None] = mapped_column("ticket_id", String)
    send_attempts: Mapped[int] = mapped_column("send_attempts", Integer, default=0)
    last_error: Mapped[str | None] = mapped_column("last_error", Text)
    created_at: Mapped[datetime] = mapped_column("created_at", DateTime(timezone=False), server_default=func.now())


class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    provider_name: Mapped[str] = mapped_column("provider_name", String, nullable=False)
    npi: Mapped[str] = mapped_column(String, nullable=False)


class LogRecord(Base):
    __tablename__ = "logs"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    email_id: Mapped[str | None] = mapped_column("email_id", String, ForeignKey("emails.id", ondelete="SET NULL"))
    message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column("created_at", DateTime(timezone=False), server_default=func.now())

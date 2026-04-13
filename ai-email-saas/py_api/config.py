from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")


def _optional(name: str, default: str | None = None) -> str | None:
    value = os.getenv(name)
    if value is None:
        return default
    trimmed = value.strip()
    return trimmed or default


def _required(name: str) -> str:
    value = _optional(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def _parse_origins(*values: str | None) -> list[str]:
    origins: list[str] = []
    seen: set[str] = set()
    for raw in values:
        if raw is None:
            continue
        for item in raw.split(","):
            cleaned = item.strip().rstrip("/")
            if cleaned and cleaned not in seen:
                seen.add(cleaned)
                origins.append(cleaned)
    if not origins:
        origins.append("http://localhost:5173")
    return origins


def _normalize_database_url(url: str) -> str:
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    return url


def _normalize_groq_model(value: str | None) -> str:
    model = value or "llama-3.3-70b-versatile"
    deprecated = {
        "llama3-70b-8192": "llama-3.3-70b-versatile",
        "llama3-8b-8192": "llama-3.1-8b-instant",
    }
    return deprecated.get(model, model)


@dataclass(frozen=True)
class Settings:
    port: int
    frontend_origins: list[str]
    database_url: str
    groq_api_key: str
    groq_model: str
    email_user: str
    email_pass: str
    email_from: str
    imap_host: str
    imap_port: int
    imap_max_fetch: int
    smtp_host: str
    smtp_port: int
    smtp_secure: bool
    docs_root: Path
    frontend_dist: Path


def get_settings() -> Settings:
    port = int(_optional("PORT", "3001") or "3001")
    frontend_origins = _parse_origins(
        _optional("FRONTEND_ORIGIN"),
        _optional("RENDER_EXTERNAL_URL"),
        "http://localhost:5173",
        f"http://localhost:{port}",
        f"http://127.0.0.1:{port}",
    )
    return Settings(
        port=port,
        frontend_origins=frontend_origins,
        database_url=_normalize_database_url(_required("DATABASE_URL")),
        groq_api_key=_required("GROQ_API_KEY"),
        groq_model=_normalize_groq_model(_optional("GROQ_MODEL")),
        email_user=_required("EMAIL_USER"),
        email_pass=_required("EMAIL_PASS"),
        email_from=_optional("EMAIL_FROM", _required("EMAIL_USER")) or _required("EMAIL_USER"),
        imap_host=_optional("IMAP_HOST", "imap.gmail.com") or "imap.gmail.com",
        imap_port=int(_optional("IMAP_PORT", "993") or "993"),
        imap_max_fetch=int(_optional("IMAP_MAX_FETCH", "1") or "1"),
        smtp_host=_optional("SMTP_HOST", "smtp.gmail.com") or "smtp.gmail.com",
        smtp_port=int(_optional("SMTP_PORT", "465") or "465"),
        smtp_secure=(_optional("SMTP_SECURE", "true") or "true").lower() == "true",
        docs_root=ROOT_DIR / "docs",
        frontend_dist=ROOT_DIR / "frontend" / "dist",
    )


settings = get_settings()

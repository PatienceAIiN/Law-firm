from __future__ import annotations

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .config import settings
from .db import engine, session_scope
from .models import Base
from .schemas import TestEmailPayload
from .services import (
    approve_and_send,
    email_to_dict,
    list_emails,
    list_logs,
    log_to_dict,
    reject_email,
    review_queue,
    run_pipeline,
    run_test_email_flow,
    stats,
)


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health() -> dict[str, bool]:
    return {"ok": True}


@app.get("/process")
def process() -> dict[str, int]:
    with session_scope() as session:
        return run_pipeline(session)


@app.post("/test-email")
def test_email(payload: TestEmailPayload) -> dict[str, object]:
    with session_scope() as session:
        row = run_test_email_flow(session, payload.text)
        return {"ok": True, "email": email_to_dict(row)}


@app.get("/emails")
def emails(
    status: str | None = None,
    q: str | None = None,
    category: str | None = None,
    limit: int = Query(default=100, ge=1, le=500),
) -> list[dict[str, object]]:
    with session_scope() as session:
        return [email_to_dict(row) for row in list_emails(session, status, q, category, limit)]


@app.get("/review")
def review() -> list[dict[str, object]]:
    with session_scope() as session:
        return [email_to_dict(row) for row in review_queue(session)]


@app.post("/approve/{email_id}")
def approve(email_id: str) -> dict[str, bool]:
    with session_scope() as session:
        try:
            approve_and_send(session, email_id)
        except ValueError as exc:
            raise HTTPException(status_code=404 if str(exc) == "Email not found" else 400, detail=str(exc)) from exc
        return {"ok": True}


@app.post("/reject/{email_id}")
def reject(email_id: str) -> dict[str, bool]:
    with session_scope() as session:
        try:
            reject_email(session, email_id)
        except ValueError as exc:
            raise HTTPException(status_code=404 if str(exc) == "Email not found" else 400, detail=str(exc)) from exc
        return {"ok": True}


@app.get("/logs")
def logs(limit: int = Query(default=200, ge=1, le=500)) -> list[dict[str, object]]:
    with session_scope() as session:
        return [log_to_dict(row) for row in list_logs(session, limit)]


@app.get("/stats")
def get_stats() -> dict[str, int]:
    with session_scope() as session:
        return stats(session)


if settings.frontend_dist.exists():
    assets_dir = settings.frontend_dist / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def frontend(full_path: str) -> FileResponse:
        target = (settings.frontend_dist / full_path).resolve()
        try:
            target.relative_to(settings.frontend_dist.resolve())
        except ValueError:
            return FileResponse(settings.frontend_dist / "index.html")
        if full_path and target.exists() and target.is_file():
            return FileResponse(target)
        return FileResponse(settings.frontend_dist / "index.html")

import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../api.js";

export default function Review() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busyId, setBusyId] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const data = await apiGet("/review");
      setRows(data);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id) {
    setBusyId(id);
    setErr("");
    try {
      await apiPost(`/approve/${id}`);
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusyId("");
    }
  }

  async function reject(id) {
    setBusyId(id);
    setErr("");
    try {
      await apiPost(`/reject/${id}`);
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-950">
            Review queue
          </h1>
          <p className="mt-1 text-sm text-ink-700">
            Confidence 60–79 (review) and below 60 (manual). Approve sends Brevo
            reply with retries.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="rounded-lg border border-mist-200 bg-white px-3 py-2 text-sm font-medium text-ink-900 shadow-sm hover:bg-mist-100"
        >
          Refresh
        </button>
      </div>

      {err ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {err}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-ink-700">Loading…</p>
      ) : (
        <div className="space-y-4">
          {rows.map((r) => (
            <article
              key={r.id}
              className="rounded-xl border border-mist-200 bg-white p-5 shadow-sm ring-1 ring-black/5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-display text-lg font-semibold text-ink-950">
                    {r.subject}
                  </p>
                  <p className="mt-1 text-sm text-ink-700">{r.sender}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-mist-100 px-2 py-1 font-medium text-ink-900 ring-1 ring-mist-200">
                      status: {r.status}
                    </span>
                    <span className="rounded-full bg-mist-100 px-2 py-1 font-medium text-ink-900 ring-1 ring-mist-200">
                      route: {r.routingMode}
                    </span>
                    <span className="rounded-full bg-mist-100 px-2 py-1 font-medium text-ink-900 ring-1 ring-mist-200">
                      confidence: {r.confidence ?? "—"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() => approve(r.id)}
                    className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 disabled:opacity-60"
                  >
                    Approve & send
                  </button>
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() => reject(r.id)}
                    className="rounded-lg border border-mist-200 bg-white px-3 py-2 text-sm font-semibold text-ink-900 shadow-sm hover:bg-mist-100 disabled:opacity-60"
                  >
                    Reject
                  </button>
                </div>
              </div>
              {r.summary ? (
                <p className="mt-4 text-sm leading-relaxed text-ink-700">
                  <span className="font-semibold text-ink-950">Summary: </span>
                  {r.summary}
                </p>
              ) : null}
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-accent">
                  Raw body
                </summary>
                <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-ink-950 p-3 text-xs text-mist-100">
                  {r.body}
                </pre>
              </details>
            </article>
          ))}
          {!rows.length ? (
            <p className="rounded-xl border border-dashed border-mist-300 bg-white/60 px-4 py-8 text-center text-sm text-ink-700">
              Queue is empty. Messages with medium or low confidence land here
              after <code className="rounded bg-mist-100 px-1">/process</code>.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

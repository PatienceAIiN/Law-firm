import { useEffect, useState } from "react";
import { apiGet } from "../api.js";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [runResult, setRunResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const s = await apiGet("/stats");
        if (!cancelled) setStats(s);
      } catch (e) {
        if (!cancelled) setErr(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [runResult]);

  async function runProcess() {
    setProcessing(true);
    setErr("");
    try {
      const r = await apiGet("/process");
      setRunResult(r);
    } catch (e) {
      setErr(e.message);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-950">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-ink-700">
            Trigger the full pipeline once (cron calls the same endpoint).
          </p>
        </div>
        <button
          type="button"
          onClick={runProcess}
          disabled={processing}
          className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {processing ? "Running pipeline…" : "Run /process now"}
        </button>
      </div>

      {err ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {err}
        </div>
      ) : null}

      {runResult ? (
        <div className="rounded-xl border border-mist-200 bg-white p-4 shadow-sm ring-1 ring-black/5">
          <p className="text-sm font-semibold text-ink-950">Last run</p>
          <dl className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-700">
                Processed
              </dt>
              <dd className="text-2xl font-semibold">{runResult.processed}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-700">
                Skipped
              </dt>
              <dd className="text-2xl font-semibold">{runResult.skipped}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-700">
                Failed
              </dt>
              <dd className="text-2xl font-semibold">{runResult.failed}</dd>
            </div>
          </dl>
        </div>
      ) : null}

      {loading && !stats ? (
        <p className="text-sm text-ink-700">Loading stats…</p>
      ) : null}

      {stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {[
            ["Total emails", stats.totalEmails],
            ["In review queue", stats.inReview],
            ["Auto-sent", stats.autoSent],
            ["Send failures", stats.sendFailed],
            ["Ingested today", stats.ingestedToday],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-mist-200 bg-white p-4 shadow-sm ring-1 ring-black/5"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-ink-700">
                {label}
              </p>
              <p className="mt-2 font-display text-3xl font-semibold text-ink-950">
                {value}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

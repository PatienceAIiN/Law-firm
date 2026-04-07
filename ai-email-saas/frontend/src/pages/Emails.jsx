import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../api.js";

function StatusPill({ status }) {
  const map = {
    review: "bg-amber-100 text-amber-900 ring-amber-200",
    manual: "bg-orange-100 text-orange-900 ring-orange-200",
    auto_sent: "bg-emerald-100 text-emerald-900 ring-emerald-200",
    send_failed: "bg-red-100 text-red-900 ring-red-200",
    processed: "bg-slate-100 text-slate-900 ring-slate-200",
    approved: "bg-blue-100 text-blue-900 ring-blue-200",
    rejected: "bg-zinc-200 text-zinc-800 ring-zinc-300",
    pending_auto: "bg-violet-100 text-violet-900 ring-violet-200",
  };
  const cls = map[status] || "bg-mist-100 text-ink-900 ring-mist-200";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {status}
    </span>
  );
}

export default function Emails() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (status) p.set("status", status);
    p.set("limit", "150");
    const s = p.toString();
    return s ? `?${s}` : "?limit=150";
  }, [q, status]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await apiGet(`/emails${query}`);
        if (!cancelled) setRows(data);
      } catch (e) {
        if (!cancelled) setErr(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [query]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-950">
          Emails
        </h1>
        <p className="mt-1 text-sm text-ink-700">
          Search and filter ingested messages.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="text-xs font-medium text-ink-700">Search</label>
          <input
            className="mt-1 w-full rounded-lg border border-mist-200 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-accent/30 focus:ring-2"
            placeholder="Subject, sender, body, NPI…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="sm:w-48">
          <label className="text-xs font-medium text-ink-700">Status</label>
          <select
            className="mt-1 w-full rounded-lg border border-mist-200 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-accent/30 focus:ring-2"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All</option>
            <option value="review">review</option>
            <option value="manual">manual</option>
            <option value="auto_sent">auto_sent</option>
            <option value="processed">processed</option>
            <option value="send_failed">send_failed</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
          </select>
        </div>
      </div>

      {err ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {err}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-ink-700">Loading…</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-mist-200 bg-white shadow-sm ring-1 ring-black/5">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-mist-200 text-left text-sm">
              <thead className="bg-mist-100/80 text-xs uppercase tracking-wide text-ink-700">
                <tr>
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Subject</th>
                  <th className="px-4 py-3 font-medium">Sender</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Conf.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist-200">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-mist-100/40">
                    <td className="whitespace-nowrap px-4 py-3 text-ink-700">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 font-medium text-ink-950">
                      {r.subject}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-ink-700">
                      {r.sender}
                    </td>
                    <td className="px-4 py-3 text-ink-700">{r.category || "—"}</td>
                    <td className="px-4 py-3 text-ink-700">
                      {r.confidence ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!rows.length ? (
            <p className="px-4 py-6 text-center text-sm text-ink-700">
              No emails yet. Run <code className="rounded bg-mist-100 px-1">GET /process</code>{" "}
              after mail arrives.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

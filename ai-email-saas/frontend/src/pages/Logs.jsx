import { useEffect, useState } from "react";
import { apiGet } from "../api.js";

export default function Logs() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await apiGet("/logs?limit=250");
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
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-950">
          Logs
        </h1>
        <p className="mt-1 text-sm text-ink-700">
          Ingestion, classification, routing, and delivery events.
        </p>
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
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist-200">
                {rows.map((r) => (
                  <tr key={r.id} className="align-top hover:bg-mist-100/40">
                    <td className="whitespace-nowrap px-4 py-3 text-ink-700">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-mist-100 px-2 py-1 text-xs font-medium text-ink-900">
                        {r.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-ink-700">
                      {r.emailId ? r.emailId.slice(0, 8) + "…" : "—"}
                    </td>
                    <td className="max-w-xl px-4 py-3 text-ink-800">{r.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

import { NavLink, Outlet } from "react-router-dom";

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive
      ? "bg-white text-ink-900 shadow-sm ring-1 ring-mist-200"
      : "text-ink-700 hover:bg-white/60"
  }`;

export default function Layout() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-mist-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-lg font-semibold tracking-tight text-ink-950">
              OpsMail
            </p>
            <p className="text-sm text-ink-700">
              AI ingestion, routing, and human review
            </p>
          </div>
          <nav className="flex flex-wrap gap-1">
            <NavLink to="/" end className={linkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/emails" className={linkClass}>
              Emails
            </NavLink>
            <NavLink to="/review" className={linkClass}>
              Review
            </NavLink>
            <NavLink to="/logs" className={linkClass}>
              Logs
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}

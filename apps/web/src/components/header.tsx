import { Link } from "@tanstack/react-router";
import { Bell, Settings, UserCircle2 } from "lucide-react";

export default function Header() {
  const navLinkClass =
    "border-b-2 border-transparent py-5 transition-colors hover:text-slate-900 dark:hover:text-slate-100";
  const activeNavClass = "border-blue-600 text-blue-700 dark:text-blue-300";

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center gap-12">
        <p className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          GROUNDUP.AI
        </p>
        <nav className="flex h-full items-center gap-6 text-sm font-semibold text-slate-500 dark:text-slate-400">
          <Link to="/" className={navLinkClass} activeProps={{ className: activeNavClass }}>
            Dashboard
          </Link>
          <Link
            to="/alerts/$alertId"
            params={{ alertId: "alert-001" }}
            className={navLinkClass}
            activeProps={{ className: activeNavClass }}
          >
            Alerts
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
        <button className="rounded-md p-1.5 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-100">
          <Settings className="h-5 w-5" />
        </button>
        <button className="relative rounded-md p-1.5 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-100">
          <Bell className="h-5 w-5" />
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
            3
          </span>
        </button>
        <div className="h-7 w-px bg-slate-200 dark:bg-slate-800" />
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
          <UserCircle2 className="h-5 w-5" />
          <span>Welcome Admin</span>
        </div>
      </div>
    </header>
  );
}

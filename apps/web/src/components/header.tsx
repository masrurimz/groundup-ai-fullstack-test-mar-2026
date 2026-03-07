import { Link } from "@tanstack/react-router";
import { Bell, Settings, UserCircle2 } from "lucide-react";

export default function Header() {
  const navLinkClass = "border-b-2 border-transparent py-5 transition-colors hover:text-foreground";
  const activeNavClass = "border-primary text-primary";

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-12">
        <p className="text-xl font-bold tracking-tight text-foreground">GROUNDUP.AI</p>
        <nav className="flex h-full items-center gap-6 text-sm font-semibold text-muted-foreground">
          <Link to="/" className={navLinkClass} activeProps={{ className: activeNavClass }}>
            Dashboard
          </Link>
          <Link to="/alerts" className={navLinkClass} activeProps={{ className: activeNavClass }}>
            Alerts
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-4 text-muted-foreground">
        <button
          aria-label="Open settings"
          className="rounded-md p-1.5 transition-colors hover:bg-muted hover:text-foreground"
        >
          <Settings className="h-5 w-5" />
        </button>
        <button
          aria-label="View notifications"
          className="relative rounded-md p-1.5 transition-colors hover:bg-muted hover:text-foreground"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            3
          </span>
        </button>
        <div className="h-7 w-px bg-border" />
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <UserCircle2 className="h-5 w-5" />
          <span>Welcome Admin</span>
        </div>
      </div>
    </header>
  );
}

import { Link, useMatchRoute } from "@tanstack/react-router";
import { Bell, Settings, User } from "lucide-react";

import { cn } from "@/lib/utils";

export default function Header() {
  const matchRoute = useMatchRoute();

  const navLinkClass = (to: string) =>
    cn(
      "h-full flex items-center px-1 border-b-4 border-transparent text-sm font-medium text-muted-foreground transition-colors hover:text-foreground uppercase",
      matchRoute({ to, fuzzy: to !== "/" }) && "border-primary text-blue-800",
    );

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex h-full items-center gap-12">
        <p className="text-xl font-bold tracking-tighter text-gray-800">GROUNDUP.AI</p>
        <nav className="flex h-full items-center gap-8">
          <Link to="/" className={navLinkClass("/")}>
            Dashboard
          </Link>
          <Link to="/alerts" search={{ machine: undefined }} className={navLinkClass("/alerts")}>
            Alerts
          </Link>
        </nav>
      </div>

      <div className="flex h-full items-center gap-4">
        <Link
          to="/settings"
          aria-label="Open settings"
          className={cn(
            "flex h-full items-center border-b-4 border-transparent px-1 text-gray-400 transition-colors hover:text-gray-600",
            matchRoute({ to: "/settings", fuzzy: true }) && "border-primary text-primary",
          )}
        >
          <Settings className="h-5 w-5" />
        </Link>
        <button
          type="button"
          aria-label="View profile"
          className="text-gray-400 hover:text-gray-600"
        >
          <User className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="View notifications"
          className="relative text-gray-400 hover:text-gray-600"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-blue-500 text-[10px] font-bold text-primary-foreground">
            3
          </span>
        </button>
        <div className="h-8 w-px bg-border" />
        <span className="text-sm font-medium text-gray-700">Welcome Admin!</span>
      </div>
    </header>
  );
}

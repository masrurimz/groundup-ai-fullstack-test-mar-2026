import { Link, useMatchRoute } from "@tanstack/react-router";
import { Bell, Settings, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Header() {
  const matchRoute = useMatchRoute();

  const navLinkClass = (to: string) =>
    cn(
      "h-full flex items-center px-1 border-b-4 border-transparent text-sm font-medium text-muted-foreground transition-colors hover:text-foreground uppercase tracking-wide",
      matchRoute({ to, fuzzy: true }) && "border-primary text-primary",
    );

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex h-full items-center gap-12">
        <p className="text-xl font-bold tracking-tighter text-foreground">GROUNDUP.AI</p>
        <nav className="flex h-full items-center gap-8">
          <Link to="/" className={navLinkClass("/")}>
            Dashboard
          </Link>
          <Link to="/alerts" className={navLinkClass("/alerts")}>
            Alerts
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-4 text-muted-foreground">
        <Button variant="ghost" size="icon" aria-label="Open settings">
          <Settings className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="View profile">
          <User className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="View notifications" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full border-2 border-card bg-primary text-[10px] font-bold text-primary-foreground">
            3
          </span>
        </Button>
        <div className="h-8 w-px bg-border" />
        <span className="text-sm font-medium text-foreground">Welcome Admin!</span>
      </div>
    </header>
  );
}

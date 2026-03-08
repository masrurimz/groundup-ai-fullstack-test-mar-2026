import { Link, Outlet, createFileRoute, useMatchRoute } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  component: SettingsLayout,
});

const NAV_ITEMS = [
  { to: "/settings/machines", label: "Machines" },
  { to: "/settings/reasons", label: "Reasons" },
  { to: "/settings/actions", label: "Actions" },
] as const;

function SettingsLayout() {
  const matchRoute = useMatchRoute();

  return (
    <main className="flex min-h-0 flex-1 overflow-hidden bg-background">
      {/* Sidebar nav */}
      <aside className="w-52 shrink-0 border-r border-border bg-card px-3 py-6">
        <p className="mb-4 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Configuration
        </p>
        <nav className="flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                matchRoute({ to, fuzzy: false }) && "bg-muted text-foreground",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Page content */}
      <div className="min-w-0 flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </main>
  );
}

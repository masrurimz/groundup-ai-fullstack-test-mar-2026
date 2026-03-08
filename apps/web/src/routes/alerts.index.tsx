import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/alerts/")({
  component: AlertsIndexPage,
});

function AlertsIndexPage() {
  const { machine } = Route.useSearch();

  return (
    <section className="grid h-full place-items-center bg-card px-6">
      <div className="max-w-md text-center">
        <h2 className="text-lg font-semibold text-foreground">
          {machine ? "Select an alert" : "Select a machine"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {machine
            ? "Choose an alert from the sidebar to view its details."
            : "Choose a machine from the sidebar to view its alerts."}
        </p>
      </div>
    </section>
  );
}

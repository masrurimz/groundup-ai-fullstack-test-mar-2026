import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/alerts/")({
  component: AlertsIndexPage,
});

function AlertsIndexPage() {
  return (
    <section className="grid h-full place-items-center bg-card px-6">
      <div className="max-w-md text-center">
        <h2 className="text-lg font-semibold text-foreground">Select an alert</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose an alert from the sidebar to view its details.
        </p>
      </div>
    </section>
  );
}

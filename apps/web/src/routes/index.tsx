import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { fetchAlerts, type Alert } from "../lib/api";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

const TITLE_TEXT = `
 ██████╗ ███████╗████████╗████████╗███████╗██████╗
 ██╔══██╗██╔════╝╚══██╔══╝╚══██╔══╝██╔════╝██╔══██╗
 ██████╔╝█████╗     ██║      ██║   █████╗  ██████╔╝
 ██╔══██╗██╔══╝     ██║      ██║   ██╔══╝  ██╔══██╗
 ██████╔╝███████╗   ██║      ██║   ███████╗██║  ██║
 ╚═════╝ ╚══════╝   ╚═╝      ╚═╝   ╚══════╝╚═╝  ╚═╝

 ████████╗    ███████╗████████╗ █████╗  ██████╗██╗  ██╗
 ╚══██╔══╝    ██╔════╝╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝
    ██║       ███████╗   ██║   ███████║██║     █████╔╝
    ██║       ╚════██║   ██║   ██╔══██║██║     ██╔═██╗
    ██║       ███████║   ██║   ██║  ██║╚██████╗██║  ██╗
    ╚═╝       ╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝
 `;

function HomeComponent() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAlerts();
      setAlerts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch alerts");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-2">
      <pre className="overflow-x-auto font-mono text-sm">{TITLE_TEXT}</pre>
      <div className="grid gap-6">
        <section className="rounded-lg border p-4">
          <h2 className="mb-2 font-medium">API Status</h2>
          <button
            onClick={handleFetchAlerts}
            disabled={loading}
            className="rounded bg-blue-500 px-4 py-2 text-white disabled:opacity-50"
          >
            {loading ? "Loading..." : "Fetch Alerts"}
          </button>
          {error && <p className="mt-2 text-red-500">{error}</p>}
          {alerts.length > 0 && (
            <ul className="mt-2 list-inside list-disc">
              {alerts.map((alert) => (
                <li key={alert.id}>{alert.title}</li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

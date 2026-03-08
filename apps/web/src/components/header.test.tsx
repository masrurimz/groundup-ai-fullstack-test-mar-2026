import { describe, expect, it } from "vitest";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";

import { act, render, screen } from "@/test/test-utils";
import Header from "@/components/header";

/**
 * Build a minimal in-memory router whose root component renders the Header.
 * Child routes are required so that useMatchRoute works without errors.
 */
function createTestRouter(initialPath = "/") {
  const rootRoute = createRootRoute({ component: Header });
  const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: "/" });
  const alertsRoute = createRoute({ getParentRoute: () => rootRoute, path: "/alerts" });
  const settingsRoute = createRoute({ getParentRoute: () => rootRoute, path: "/settings" });
  const routeTree = rootRoute.addChildren([indexRoute, alertsRoute, settingsRoute]);
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
}

describe("Header", () => {
  it("renders the brand name 'GROUNDUP.AI'", async () => {
    await act(async () => {
      render(<RouterProvider router={createTestRouter()} />);
    });
    expect(screen.getByText("GROUNDUP.AI")).toBeDefined();
  });

  it("renders Dashboard and Alerts navigation links", async () => {
    await act(async () => {
      render(<RouterProvider router={createTestRouter()} />);
    });
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Alerts" })).toBeDefined();
  });

  it("renders the Settings icon link", async () => {
    await act(async () => {
      render(<RouterProvider router={createTestRouter()} />);
    });
    expect(screen.getByRole("link", { name: /open settings/i })).toBeDefined();
  });
});

import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen } from "@/test/test-utils";
import { AlertsSidebar } from "@/components/alerts/alerts-sidebar";
import type { AlertItem } from "@/components/alerts/types";

function makeAlert(id: string, overrides: Partial<AlertItem> = {}): AlertItem {
  return {
    id,
    serial_number: 1,
    title: `Alert ${id}`,
    description: "desc",
    severity: "info",
    status: "unresolved",
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
    machine: "Machine A",
    machine_id: null,
    anomaly_type: "Moderate",
    sensor: "sensor-1",
    sound_clip: "",
    suspected_reason: null,
    suspected_reason_id: null,
    action: null,
    action_id: null,
    comment: null,
    ...overrides,
  };
}

const alerts: AlertItem[] = [
  makeAlert("a1", { serial_number: 1, title: "Alert One", machine: "Machine A" }),
  makeAlert("a2", { serial_number: 2, title: "Alert Two", machine: "Machine B" }),
  makeAlert("a3", { serial_number: 3, title: "Alert Three", machine: "Machine A" }),
];

const defaultProps = {
  alerts,
  machineOptions: ["Machine A", "Machine B"],
  newAlertCount: 0,
  onMachineChange: vi.fn(),
  onBack: vi.fn(),
  onSelectAlert: vi.fn(),
};

describe("AlertsSidebar", () => {
  it("renders alert count text", () => {
    render(<AlertsSidebar {...defaultProps} />);
    expect(screen.getByText("3 Alerts")).toBeDefined();
  });

  it("renders each alert's title in the list", () => {
    render(<AlertsSidebar {...defaultProps} />);
    expect(screen.getByText("Alert One")).toBeDefined();
    expect(screen.getByText("Alert Two")).toBeDefined();
    expect(screen.getByText("Alert Three")).toBeDefined();
  });

  it("renders 'New' badge when newAlertCount > 0", () => {
    render(<AlertsSidebar {...defaultProps} newAlertCount={5} />);
    expect(screen.getByText("5 New")).toBeDefined();
  });

  it("does NOT render 'New' badge when newAlertCount === 0", () => {
    render(<AlertsSidebar {...defaultProps} newAlertCount={0} />);
    expect(screen.queryByText(/\d+ New/)).toBeNull();
  });

  it("calls onBack when the Dashboard back button is clicked", () => {
    const onBack = vi.fn();
    render(<AlertsSidebar {...defaultProps} onBack={onBack} />);
    fireEvent.click(screen.getByRole("button", { name: /dashboard/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("calls onSelectAlert when an alert list item is clicked", () => {
    const onSelectAlert = vi.fn();
    render(<AlertsSidebar {...defaultProps} onSelectAlert={onSelectAlert} />);
    fireEvent.click(screen.getByText("Alert One"));
    expect(onSelectAlert).toHaveBeenCalledWith("a1");
  });

  it("renders the Select trigger for the machine filter", () => {
    render(<AlertsSidebar {...defaultProps} />);
    expect(screen.getByRole("combobox")).toBeDefined();
  });

  it("selectedAlertId highlights the correct alert item with blue border", () => {
    const { container } = render(<AlertsSidebar {...defaultProps} selectedAlertId="a1" />);
    // Alert a1 is first; its card should carry the active (blue) border class
    const cards = container.querySelectorAll("[data-slot='card']");
    const activeCard = cards[0];
    expect(activeCard?.className).toContain("border-blue-500");
    // The other cards should NOT carry the active border
    expect(cards[1]?.className).not.toContain("border-blue-500");
  });
});

import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen } from "@/test/test-utils";
import { AlertListItem } from "@/components/alerts/alert-list-item";
import type { AlertItem } from "@/components/alerts/types";

const baseAlert: AlertItem = {
  id: "alert-1",
  serial_number: 42,
  title: "Test Alert Title",
  description: "Test description",
  severity: "critical",
  status: "active",
  created_at: "2024-01-15T10:30:00Z",
  updated_at: "2024-01-15T10:30:00Z",
  machine: "Machine A",
  machine_id: "machine-1",
  anomaly_type: "Severe",
  sensor: "sensor-1",
  sound_clip: "",
  suspected_reason: null,
  suspected_reason_id: null,
  action: null,
  action_id: null,
  comment: null,
};

describe("AlertListItem", () => {
  it("renders serial number as '#42'", () => {
    render(<AlertListItem alert={baseAlert} active={false} onSelect={vi.fn()} />);
    expect(screen.getByText("#42")).toBeDefined();
  });

  it("renders title and machine name", () => {
    render(<AlertListItem alert={baseAlert} active={false} onSelect={vi.fn()} />);
    expect(screen.getByText("Test Alert Title")).toBeDefined();
    expect(screen.getByText("Machine A")).toBeDefined();
  });

  it("renders SeverityBadge with the correct severity text", () => {
    render(<AlertListItem alert={baseAlert} active={false} onSelect={vi.fn()} />);
    expect(screen.getByText("critical")).toBeDefined();
  });

  it("calls onSelect with alert.id when the button is clicked", () => {
    const onSelect = vi.fn();
    render(<AlertListItem alert={baseAlert} active={false} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledWith("alert-1");
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("active=true applies blue border styling to the card", () => {
    const { container } = render(
      <AlertListItem alert={baseAlert} active={true} onSelect={vi.fn()} />,
    );
    const card = container.querySelector("[data-slot='card']");
    expect(card?.className).toContain("border-blue-500");
  });

  it("active=false applies hover transition styling to the card", () => {
    const { container } = render(
      <AlertListItem alert={baseAlert} active={false} onSelect={vi.fn()} />,
    );
    const card = container.querySelector("[data-slot='card']");
    expect(card?.className).toContain("hover:border-gray-300");
  });

  it("status='active' shows a filled blue dot indicator", () => {
    const { container } = render(
      <AlertListItem
        alert={{ ...baseAlert, status: "active" }}
        active={false}
        onSelect={vi.fn()}
      />,
    );
    // The dot span gets bg-blue-500 only when status is active
    const dot = container.querySelector(".bg-blue-500.rounded-full");
    expect(dot).not.toBeNull();
  });

  it("status != 'active' shows a bordered (unfilled) dot indicator", () => {
    const { container } = render(
      <AlertListItem
        alert={{ ...baseAlert, status: "resolved" }}
        active={false}
        onSelect={vi.fn()}
      />,
    );
    // The dot span gets border-border when status is not active
    const dot = container.querySelector(".border-border");
    expect(dot).not.toBeNull();
  });

  it("renders 'Detected at' timestamp text (locale-independent)", () => {
    render(<AlertListItem alert={baseAlert} active={false} onSelect={vi.fn()} />);
    const el = screen.getByText(/Detected at/);
    expect(el.textContent?.length).toBeGreaterThan("Detected at ".length);
  });
});

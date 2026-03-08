import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatsCard } from "@/components/dashboard/stats-card";

describe("StatsCard", () => {
  it("renders title and value", () => {
    render(<StatsCard title="Active Alerts" value={42} icon={<span>icon</span>} />);
    expect(screen.getByText("Active Alerts")).toBeDefined();
    expect(screen.getByText("42")).toBeDefined();
  });

  it("renders description when provided", () => {
    render(
      <StatsCard
        title="Machines"
        value={8}
        icon={<span>icon</span>}
        description="Total monitored"
      />,
    );
    expect(screen.getByText("Total monitored")).toBeDefined();
  });

  it("does not render description when omitted", () => {
    render(<StatsCard title="Score" value={100} icon={<span />} />);
    expect(screen.queryByText("Total monitored")).toBeNull();
  });

  it("renders change indicator for positive value", () => {
    render(
      <StatsCard
        title="Uptime"
        value="99%"
        icon={<span />}
        change={{ value: 5, label: "vs last week" }}
      />,
    );
    expect(screen.getByText(/↑/)).toBeDefined();
  });

  it("renders change indicator for negative value", () => {
    render(
      <StatsCard
        title="Errors"
        value={3}
        icon={<span />}
        change={{ value: -12, label: "vs last week" }}
      />,
    );
    expect(screen.getByText(/↓/)).toBeDefined();
  });

  it("applies variant class for critical", () => {
    const { container } = render(
      <StatsCard title="Critical" value={1} icon={<span />} variant="critical" />,
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("red");
  });

  it("applies variant class for warning", () => {
    const { container } = render(
      <StatsCard title="Warning" value={2} icon={<span />} variant="warning" />,
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("yellow");
  });
});

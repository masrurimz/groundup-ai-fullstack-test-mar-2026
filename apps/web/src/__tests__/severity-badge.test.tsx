import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SeverityBadge } from "@/components/alerts/severity-badge";

describe("SeverityBadge", () => {
  it("renders the severity label text", () => {
    render(<SeverityBadge severity="Critical" />);
    expect(screen.getByText("Critical")).toBeDefined();
  });

  it("renders warning severity", () => {
    render(<SeverityBadge severity="Warning" />);
    expect(screen.getByText("Warning")).toBeDefined();
  });

  it("renders unknown severity without crashing", () => {
    render(<SeverityBadge severity="Unknown" />);
    expect(screen.getByText("Unknown")).toBeDefined();
  });

  it("is case-insensitive for class lookup", () => {
    // 'CRITICAL' lowercase matches 'critical' key
    const { container: a } = render(<SeverityBadge severity="CRITICAL" />);
    const { container: b } = render(<SeverityBadge severity="critical" />);
    const classA = (a.firstChild as HTMLElement)?.className;
    const classB = (b.firstChild as HTMLElement)?.className;
    expect(classA).toEqual(classB);
  });
});

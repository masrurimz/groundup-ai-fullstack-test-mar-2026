import { describe, expect, it } from "vitest";

import { render, screen } from "@/test/test-utils";
import { StatusBadge } from "@/components/alerts/status-badge";

describe("StatusBadge", () => {
  it("renders 'active' status text", () => {
    render(<StatusBadge status="active" />);
    expect(screen.getByText("active")).toBeDefined();
  });

  it("renders 'acknowledged' status text", () => {
    render(<StatusBadge status="acknowledged" />);
    expect(screen.getByText("acknowledged")).toBeDefined();
  });

  it("renders 'resolved' status text", () => {
    render(<StatusBadge status="resolved" />);
    expect(screen.getByText("resolved")).toBeDefined();
  });

  it("unknown status falls back without throwing", () => {
    expect(() => {
      render(<StatusBadge status="unknown-xyz" />);
    }).not.toThrow();
    expect(screen.getByText("unknown-xyz")).toBeDefined();
  });

  it("is case-insensitive: 'ACTIVE' resolves to the same styling as 'active'", () => {
    const { container: upper } = render(<StatusBadge status="ACTIVE" />);
    const { container: lower } = render(<StatusBadge status="active" />);
    const classUpper = (upper.firstChild as HTMLElement)?.className;
    const classLower = (lower.firstChild as HTMLElement)?.className;
    expect(classUpper).toEqual(classLower);
  });
});

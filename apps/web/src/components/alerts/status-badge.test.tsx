import { describe, expect, it } from "vitest";

import { render, screen } from "@/test/test-utils";
import { StatusBadge } from "@/components/alerts/status-badge";

describe("StatusBadge", () => {
  it("renders 'unresolved' status text", () => {
    render(<StatusBadge status="unresolved" />);
    expect(screen.getByText("unresolved")).toBeDefined();
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

  it("is case-insensitive: 'UNRESOLVED' resolves to the same styling as 'unresolved'", () => {
    const { container: upper } = render(<StatusBadge status="UNRESOLVED" />);
    const { container: lower } = render(<StatusBadge status="unresolved" />);
    const classUpper = (upper.firstChild as HTMLElement)?.className;
    const classLower = (lower.firstChild as HTMLElement)?.className;
    expect(classUpper).toEqual(classLower);
  });
});

import { describe, expect, it } from "vitest";
import {
  appendVary,
  preferredRepresentation,
} from "@/lib/http/content-negotiation";

describe("preferredRepresentation", () => {
  it.each([null, "", "*/*"])("defaults %s to HTML", (accept) => {
    expect(preferredRepresentation(accept)).toBe("text/html");
  });

  it("honors Markdown preference and q-values", () => {
    expect(
      preferredRepresentation("text/markdown, text/html;q=0.8"),
    ).toBe("text/markdown");
    expect(
      preferredRepresentation("text/html, text/markdown;q=0.1"),
    ).toBe("text/html");
  });

  it("uses the most specific media range before a wildcard", () => {
    expect(
      preferredRepresentation("text/markdown;q=0, */*;q=1"),
    ).toBe("text/html");
    expect(
      preferredRepresentation("text/*;q=0.5, text/markdown;q=0.9"),
    ).toBe("text/markdown");
  });

  it("uses client order to break equal-quality ties", () => {
    expect(preferredRepresentation("text/markdown, text/html")).toBe(
      "text/markdown",
    );
    expect(preferredRepresentation("text/html, text/markdown")).toBe(
      "text/html",
    );
  });

  it("returns null when no produced representation is acceptable", () => {
    expect(preferredRepresentation("application/pdf")).toBeNull();
    expect(
      preferredRepresentation("text/html;q=0, text/markdown;q=0"),
    ).toBeNull();
  });
});

describe("appendVary", () => {
  it("preserves and deduplicates existing values", () => {
    const headers = new Headers({
      Vary: "rsc, next-router-state-tree, accept",
    });

    appendVary(headers, "Accept", "Accept-Encoding");

    expect(headers.get("Vary")).toBe(
      "rsc, next-router-state-tree, accept, Accept-Encoding",
    );
  });
});

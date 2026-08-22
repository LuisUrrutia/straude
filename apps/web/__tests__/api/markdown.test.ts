import { describe, expect, it } from "vitest";
import { GET, HEAD } from "@/app/api/markdown/route";

function request(path: string, method = "GET") {
  return new Request(
    `https://straude.com/api/markdown?path=${encodeURIComponent(path)}`,
    { method },
  );
}

describe("GET /api/markdown", () => {
  it.each(["/", "/about", "/contact", "/privacy", "/cli", "/open"])(
    "serves curated Markdown for %s",
    async (path) => {
      const response = GET(request(path));
      const body = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe(
        "text/markdown; charset=utf-8",
      );
      expect(response.headers.get("Vary")).toBe("Accept, Accept-Encoding");
      expect(body).toMatch(/^# /);
      expect(body.length).toBeGreaterThan(500);
      expect(body).not.toMatch(
        /(?:exact|outgoing|preview(?: the)?|inspect(?: the)?) payload/i,
      );
    },
  );

  it.each(["/about", "/contact"])(
    "publishes the established operator on %s",
    async (path) => {
      const body = await GET(request(path)).text();

      expect(body).toContain(
        "Pacific Systems, Inc. d/b/a Straude",
      );
    },
  );

  it.each(["/", "/about", "/privacy", "/cli"])(
    "describes dry-run semantics accurately for %s",
    async (path) => {
      const body = await GET(request(path)).text();

      expect(body).toContain(
        "collect usage without submitting it",
      );
    },
  );

  it("returns a non-cacheable Markdown 404 for missing content", async () => {
    const response = GET(request("/missing"));

    expect(response.status).toBe(404);
    expect(response.headers.get("Content-Type")).toBe(
      "text/markdown; charset=utf-8",
    );
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("supports HEAD without returning a body", async () => {
    const response = HEAD(request("/about", "HEAD"));

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "text/markdown; charset=utf-8",
    );
    expect(await response.text()).toBe("");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: vi.fn(() => NextResponse.next()),
}));

import { proxy } from "@/proxy";
import { updateSession } from "@/lib/supabase/middleware";

const updateSessionMock = vi.mocked(updateSession);

function request(
  pathname: string,
  accept: string,
  options: { method?: string; headers?: Record<string, string> } = {},
) {
  return new NextRequest(`https://straude.com${pathname}`, {
    method: options.method ?? "GET",
    headers: { Accept: accept, ...options.headers },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  updateSessionMock.mockResolvedValue(NextResponse.next());
});

describe("proxy content negotiation", () => {
  it("rewrites supported Markdown requests to the internal handler", async () => {
    const response = await proxy(request("/about", "text/markdown"));
    const rewrite = response.headers.get("x-middleware-rewrite");

    expect(rewrite).toBe(
      "https://straude.com/api/markdown?path=%2Fabout",
    );
    expect(response.headers.get("Vary")).toContain("Accept");
    expect(updateSessionMock).not.toHaveBeenCalled();
  });

  it("preserves the existing HTML session path", async () => {
    const response = await proxy(request("/", "text/html"));

    expect(updateSessionMock).toHaveBeenCalledOnce();
    expect(response.headers.get("Vary")).toContain("Accept-Encoding");
  });

  it("falls back to HTML for valid pages without Markdown", async () => {
    await proxy(request("/feed", "text/markdown, text/html;q=0.5"));

    expect(updateSessionMock).toHaveBeenCalledOnce();
  });

  it("bypasses negotiation for Markdown-preferring OAuth callbacks", async () => {
    const response = await proxy(
      request("/callback?code=oauth-code", "text/markdown, text/html;q=0.1"),
    );

    expect(updateSessionMock).toHaveBeenCalledOnce();
    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
    expect(response.status).not.toBe(406);
  });

  it("returns 406 when a known page cannot satisfy Accept", async () => {
    const response = await proxy(request("/feed", "text/markdown"));

    expect(response.status).toBe(406);
    expect(response.headers.get("Vary")).toBe("Accept, Accept-Encoding");
  });

  it("returns a recovery-oriented Markdown 404 only for unknown routes", async () => {
    const response = await proxy(request("/definitely-missing", "text/markdown"));
    const body = await response.text();

    expect(response.status).toBe(404);
    expect(response.headers.get("Content-Type")).toBe(
      "text/markdown; charset=utf-8",
    );
    expect(body).toContain("https://straude.com/sitemap.xml");
    expect(body).toContain("https://straude.com/llms.txt");
  });

  it("keeps unsupported media on unknown routes as 406", async () => {
    const response = await proxy(
      request("/definitely-missing", "application/pdf"),
    );

    expect(response.status).toBe(406);
    expect(response.headers.get("Content-Type")).toBe(
      "text/plain; charset=utf-8",
    );
  });

  it.each([
    ["API", "/api/app/counts", "application/json", {}],
    ["asset", "/images/hero.png", "text/markdown", {}],
    ["RSC", "/about", "text/markdown", { rsc: "1" }],
  ])("bypasses negotiation for %s requests", async (_label, pathname, accept, headers) => {
    await proxy(request(pathname, accept, { headers }));

    expect(updateSessionMock).toHaveBeenCalledOnce();
  });

  it.each([
    ["root Open Graph image", "/opengraph-image"],
    ["root Apple icon", "/apple-icon"],
    [
      "hashed nested Open Graph image",
      "/post/abc/opengraph-image-h1a64v",
    ],
  ])("bypasses negotiation for %s", async (_label, pathname) => {
    const response = await proxy(request(pathname, "image/png"));

    expect(updateSessionMock).toHaveBeenCalledOnce();
    expect(response.status).not.toBe(406);
  });

  it("bypasses non-GET requests", async () => {
    await proxy(request("/about", "text/markdown", { method: "POST" }));

    expect(updateSessionMock).toHaveBeenCalledOnce();
  });

  it("returns a bodyless 406 for HEAD", async () => {
    const response = await proxy(
      request("/about", "application/pdf", { method: "HEAD" }),
    );

    expect(response.status).toBe(406);
    expect(await response.text()).toBe("");
  });
});

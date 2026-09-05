// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import sharp from "sharp";
import { discoverWithFetch, htmlCandidates, manifestCandidates } from "@/lib/favicons/discover";
import type { FaviconResponse } from "@/lib/favicons/public-fetch";

const origin = new URL("https://example.com");
const vector = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"><rect width="100" height="50" fill="red"/></svg>');
const response = (body: string | Buffer, url = origin.href): FaviconResponse => ({ url: new URL(url), bytes: Buffer.from(body), contentType: "" });

function site(files: Record<string, string | Buffer>) {
  let active = 0;
  let peak = 0;
  const fetch = vi.fn(async (url: URL) => {
    active++;
    peak = Math.max(active, peak);
    await new Promise((resolve) => setTimeout(resolve, url.pathname.endsWith(".svg") ? 10 : 1));
    active--;
    const body = files[url.href] ?? files[url.pathname];
    return body === undefined ? null : response(body, url.href);
  });
  return { fetch, peak: () => peak, paths: () => fetch.mock.calls.map(([url]) => url.href) };
}

describe("favicon discovery", () => {
  it("uses real HTML parsing, redirected document URL, base, rel tokens, metadata and deduplication", () => {
    const result = htmlCandidates(response('<base href="../assets/"><link REL="SHORTCUT ICON" href="mark.png" sizes="32x32"><link rel="ICON" href="mark.png"><link rel="apple-touch-icon" href="large.png" sizes="192x192"><link rel="icon" href="vector" type="image/svg+xml"><link rel="manifest" href="app.json"><meta property="og:image" content="banner.png">', "https://cdn.example.com/docs/page"));
    expect(result.icons.map((icon) => icon.url.href)).toEqual(["https://cdn.example.com/assets/vector", "https://cdn.example.com/assets/large.png", "https://cdn.example.com/assets/mark.png"]);
    expect(result.manifests[0]?.href).toBe("https://cdn.example.com/assets/app.json");
  });

  it("resolves manifest icons relative to the final manifest URL and prefers any purpose", () => {
    const result = manifestCandidates(response(JSON.stringify({ icons: [{ src: "mask.svg", purpose: "maskable" }, { src: "any.svg", purpose: "any maskable" }, { src: "mono.svg", purpose: "monochrome" }, { src: "bad.svg", purpose: "unknown" }] }), "https://cdn.example.com/apps/manifest.json"));
    expect(result.map((icon) => icon.url.href)).toEqual(["https://cdn.example.com/apps/any.svg", "https://cdn.example.com/apps/mask.svg", "https://cdn.example.com/apps/mono.svg"]);
  });

  it("returns a usable conventional SVG early and cancels other work", async () => {
    const fixture = site({ "/favicon.svg": vector });
    const cancel = vi.fn();
    const result = await discoverWithFetch(origin, fixture.fetch, cancel);
    expect(result?.format).toBe("svg");
    expect(cancel).toHaveBeenCalledOnce();
    expect(fixture.fetch).toHaveBeenCalledTimes(2);
    expect(fixture.peak()).toBe(2);
  });

  it("prefers a delayed declared manifest SVG over a fast declared PNG", async () => {
    const png = await sharp({ create: { width: 256, height: 256, channels: 4, background: "red" } }).png().toBuffer();
    const fixture = site({ "/": '<link rel="icon" href="fast.png"><link rel="manifest" href="/app/manifest.json">', "/fast.png": png,
      "/app/manifest.json": JSON.stringify({ icons: [{ src: "icon.svg", purpose: "any" }] }), "/app/icon.svg": vector });
    expect((await discoverWithFetch(origin, fixture.fetch))?.format).toBe("svg");
    expect(fixture.paths()).not.toContain("https://example.com/favicon.png");
    expect(fixture.peak()).toBeLessThanOrEqual(2);
  });

  it("keeps the raster fallback when SVG reads fail and uses deterministic quality ranking", async () => {
    const small = await sharp({ create: { width: 16, height: 16, channels: 4, background: "red" } }).png().toBuffer();
    const large = await sharp({ create: { width: 512, height: 256, channels: 4, background: "blue" } }).png().toBuffer();
    const fixture = site({ "/": '<link rel="icon" href="bad.svg"><link rel="icon" href="small.png"><link rel="icon" href="large.png">', "/small.png": small, "/large.png": large, "/bad.svg": "invalid" });
    expect(await discoverWithFetch(origin, fixture.fetch)).toMatchObject({ format: "png", width: 128, height: 64 });
  });

  it("checks conventional manifests before accepting favicon.png and leaves ICO last", async () => {
    const fixture = site({ "/manifest.webmanifest": JSON.stringify({ icons: [{ src: "/brand.svg" }] }), "/brand.svg": vector });
    expect((await discoverWithFetch(origin, fixture.fetch))?.format).toBe("svg");
    expect(fixture.paths()).not.toContain("https://example.com/favicon.ico");
    const empty = site({});
    expect(await discoverWithFetch(origin, empty.fetch)).toBeNull();
    expect(empty.paths().at(-1)).toBe("https://example.com/favicon.ico");
  });

  it("bounds declared candidates, deduplicates requests and ignores Open Graph images", async () => {
    const fixture = site({ "/": '<meta property="og:image" content="og.svg">' + Array.from({ length: 100 }, (_, i) => `<link rel="icon" href="${i}.svg"><link rel="icon" href="${i}.svg">`).join("") });
    await discoverWithFetch(origin, fixture.fetch);
    expect(new Set(fixture.paths()).size).toBe(fixture.paths().length);
    expect(fixture.paths().filter((path) => /\d+\.svg$/.test(path))).toHaveLength(12);
    expect(fixture.paths()).not.toContain("https://example.com/og.svg");
  });
});

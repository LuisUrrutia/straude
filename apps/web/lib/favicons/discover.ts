import { JSDOM } from "jsdom";
import { createPublicFetch, publicHttpUrl, type FaviconFetch, type FaviconResponse } from "./public-fetch";
import { MAX_ICON_BYTES, prepareFavicon, type PreparedFavicon } from "./image";

const DOCUMENT_BYTES = 524_288;
const MAX_CANDIDATES = 12;
type Candidate = { url: URL; svg: boolean; size: number; purpose: number; media: number };

function candidate({ raw, base, type = "", sizes = "", purpose = 0, media = 0 }: {
  raw: string; base: URL; type?: string; sizes?: string; purpose?: number; media?: number;
}): Candidate | null {
  const url = publicHttpUrl(raw, base);
  if (!url) return null;
  const dimensions = sizes.toLowerCase().split(/\s+/).slice(0, 32).map((size) => {
    const match = /^(\d+)x(\d+)$/.exec(size);
    return match ? Math.min(Number(match[1]), Number(match[2])) : 0;
  });
  return { url, svg: type.toLowerCase().split(";")[0] === "image/svg+xml" || url.pathname.toLowerCase().endsWith(".svg"), size: Math.max(0, ...dimensions), purpose, media };
}

function compareCandidates(a: Candidate, b: Candidate): number {
  return Number(b.svg) - Number(a.svg) || a.purpose - b.purpose || a.media - b.media || b.size - a.size;
}

function rank(candidates: Candidate[]): Candidate[] {
  const unique = new Map<string, Candidate>();
  for (const item of candidates) {
    const existing = unique.get(item.url.href);
    unique.set(item.url.href, existing ? {
      ...existing, svg: existing.svg || item.svg, size: Math.max(existing.size, item.size),
      purpose: Math.min(existing.purpose, item.purpose), media: Math.min(existing.media, item.media),
    } : item);
  }
  return [...unique.values()].sort(compareCandidates);
}

export function htmlCandidates(response: FaviconResponse): { icons: Candidate[]; manifests: URL[] } {
  const dom = new JSDOM(response.bytes.toString("utf8"), { url: response.url.href });
  try {
    const document = dom.window.document;
    const baseHref = document.querySelector("base[href]")?.getAttribute("href");
    const base = baseHref ? publicHttpUrl(baseHref, response.url) ?? response.url : response.url;
    const icons: Candidate[] = [];
    const manifests: URL[] = [];
    for (const link of Array.from(document.querySelectorAll("link[href]")).slice(0, 64)) {
      const rel = (link.getAttribute("rel") ?? "").toLowerCase().split(/\s+/);
      const href = link.getAttribute("href") ?? "";
      const media = (link.getAttribute("media") ?? "").trim().toLowerCase();
      // Prefer the default/light icon for the shared, theme-independent cache.
      const item = candidate({
        raw: href, base, type: link.getAttribute("type") ?? "", sizes: link.getAttribute("sizes") ?? "",
        media: !media || media === "all" || media === "screen" ? 0 : media === "(prefers-color-scheme: light)" ? 1 : 2,
      });
      if (!item) continue;
      if (rel.includes("icon") || rel.includes("apple-touch-icon")) icons.push(item);
      if (rel.includes("manifest") && !manifests.some((url) => url.href === item.url.href) && manifests.length < 2) manifests.push(item.url);
    }
    return { icons: rank(icons).slice(0, MAX_CANDIDATES), manifests };
  } finally {
    dom.window.close();
  }
}

export function manifestCandidates(response: FaviconResponse): Candidate[] {
  try {
    const manifest: unknown = JSON.parse(response.bytes.toString("utf8"));
    if (!manifest || typeof manifest !== "object" || !("icons" in manifest) || !Array.isArray(manifest.icons)) return [];
    const icons: Candidate[] = [];
    const rawIcons: unknown[] = manifest.icons;
    for (const icon of rawIcons.slice(0, 64)) {
      if (!icon || typeof icon !== "object" || !("src" in icon) || typeof icon.src !== "string") continue;
      const purposes = "purpose" in icon && typeof icon.purpose === "string" ? icon.purpose.toLowerCase().split(/\s+/) : ["any"];
      if (!purposes.some((purpose: string) => ["any", "maskable", "monochrome"].includes(purpose))) continue;
      const item = candidate({
        raw: icon.src, base: response.url,
        type: "type" in icon && typeof icon.type === "string" ? icon.type : "",
        sizes: "sizes" in icon && typeof icon.sizes === "string" ? icon.sizes : "",
        purpose: purposes.includes("any") ? 0 : purposes.includes("maskable") ? 1 : 2,
      });
      if (item) icons.push(item);
    }
    return rank(icons).slice(0, MAX_CANDIDATES);
  } catch {
    return [];
  }
}

async function pairs<T, R>(items: T[], run: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  for (let index = 0; index < items.length; index += 2) {
    results.push(...await Promise.all(items.slice(index, index + 2).map(run)));
  }
  return results;
}

export async function discoverFavicon(origin: URL, signal?: AbortSignal): Promise<PreparedFavicon | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    return await discoverWithFetch(origin, createPublicFetch(signal ? AbortSignal.any([signal, controller.signal]) : controller.signal), () => controller.abort());
  } finally {
    controller.abort();
    clearTimeout(timer);
  }
}

export async function discoverWithFetch(origin: URL, fetch: FaviconFetch, cancel: () => void = () => {}): Promise<PreparedFavicon | null> {
  const fetched = new Map<string, Promise<FaviconResponse | null>>();
  const get = (url: URL, limit: number) => {
    let pending = fetched.get(url.href);
    if (!pending) {
      pending = fetch(url, limit).catch(() => null);
      fetched.set(url.href, pending);
    }
    return pending;
  };
  const image = async (url: URL) => {
    const response = await get(url, MAX_ICON_BYTES);
    return response ? prepareFavicon(response.bytes) : null;
  };
  const [rootIcon, html] = await Promise.all([
    image(new URL("/favicon.svg", origin)).then((icon) => {
      if (icon?.format === "svg") cancel();
      return icon;
    }),
    get(origin, DOCUMENT_BYTES),
  ]);
  if (rootIcon?.format === "svg") return rootIcon;

  const declared = html ? htmlCandidates(html) : { icons: [], manifests: [] };
  const manifests = await pairs(declared.manifests, async (url) => {
    const response = await get(url, DOCUMENT_BYTES);
    return response ? manifestCandidates(response) : [];
  });
  const choose = async (items: Candidate[]) => {
    let raster: { icon: PreparedFavicon; candidate: Candidate } | null = null;
    const ranked = rank(items).slice(0, MAX_CANDIDATES);
    for (let index = 0; index < ranked.length; index += 2) {
      const pending = ranked.slice(index, index + 2).map(async (item) => ({ item, icon: await image(item.url) }));
      for (const result of pending) {
        const { icon, item } = await result;
        if (icon?.format === "svg") {
          cancel();
          return icon;
        }
        if (icon) {
          const decoded = { ...item, svg: false, size: Math.min(icon.width, icon.height) };
          if (!raster || compareCandidates(decoded, raster.candidate) < 0) raster = { icon, candidate: decoded };
        }
      }
    }
    return raster?.icon ?? null;
  };
  const declaredIcon = await choose([...declared.icons, ...manifests.flat()]);
  if (declaredIcon) return declaredIcon;
  if (rootIcon) return rootIcon;

  // Probe conventional manifests before accepting their competing PNG fallback.
  const conventional = await pairs(["/favicon.png", "/manifest.webmanifest", "/manifest.json", "/app.webmanifest"], async (path) => {
    const response = await get(new URL(path, origin), path === "/favicon.png" ? MAX_ICON_BYTES : DOCUMENT_BYTES);
    return { path, response };
  });
  const conventionalIcon = await choose(conventional.flatMap(({ path, response }) => path !== "/favicon.png" && response ? manifestCandidates(response) : []));
  if (conventionalIcon) return conventionalIcon;
  const png = conventional.find(({ path }) => path === "/favicon.png")?.response;
  const prepared = png ? await prepareFavicon(png.bytes) : null;
  return prepared ?? image(new URL("/favicon.ico", origin));
}

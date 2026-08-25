export type Representation = "text/html" | "text/markdown";

type AcceptEntry = {
  mediaType: string;
  q: number;
  order: number;
};

const DEFAULT_REPRESENTATIONS: readonly Representation[] = [
  "text/html",
  "text/markdown",
];

function parseQuality(parameter: string): number | null {
  const [name, rawValue] = parameter.split("=", 2).map((value) => value.trim());
  if (name.toLowerCase() !== "q" || rawValue === undefined) return null;

  const value = Number(rawValue);
  return Number.isFinite(value) && value >= 0 && value <= 1 ? value : 0;
}

function parseAccept(header: string): AcceptEntry[] {
  return header
    .split(",")
    .map((raw, order) => {
      const [rawMediaType, ...parameters] = raw
        .trim()
        .split(";")
        .map((value) => value.trim());
      const mediaType = rawMediaType.toLowerCase();

      if (!/^([^/\s]+|\*)\/([^/\s]+|\*)$/.test(mediaType)) return null;

      const quality = parameters
        .map(parseQuality)
        .find((value): value is number => value !== null);

      return { mediaType, q: quality ?? 1, order };
    })
    .filter((entry): entry is AcceptEntry => entry !== null);
}

function matchSpecificity(mediaRange: string, candidate: Representation): number {
  if (mediaRange === candidate) return 2;

  const [rangeType, rangeSubtype] = mediaRange.split("/");
  const [candidateType] = candidate.split("/");
  if (rangeType === candidateType && rangeSubtype === "*") return 1;
  if (rangeType === "*" && rangeSubtype === "*") return 0;
  return -1;
}

export function preferredRepresentation(
  acceptHeader: string | null,
  produces: readonly Representation[] = DEFAULT_REPRESENTATIONS,
): Representation | null {
  if (!acceptHeader?.trim()) return produces.includes("text/html") ? "text/html" : null;

  const entries = parseAccept(acceptHeader);
  let best:
    | { representation: Representation; q: number; order: number; candidateOrder: number }
    | undefined;

  produces.forEach((representation, candidateOrder) => {
    let match: { q: number; order: number; specificity: number } | undefined;

    for (const entry of entries) {
      const specificity = matchSpecificity(entry.mediaType, representation);
      if (specificity < 0) continue;
      if (
        !match ||
        specificity > match.specificity ||
        (specificity === match.specificity && entry.order < match.order)
      ) {
        match = { q: entry.q, order: entry.order, specificity };
      }
    }

    if (!match || match.q <= 0) return;
    if (
      !best ||
      match.q > best.q ||
      (match.q === best.q && match.order < best.order) ||
      (match.q === best.q &&
        match.order === best.order &&
        candidateOrder < best.candidateOrder)
    ) {
      best = { representation, q: match.q, order: match.order, candidateOrder };
    }
  });

  return best?.representation ?? null;
}

export function appendVary(headers: Headers, ...names: string[]): void {
  const existing = (headers.get("Vary") ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
  const seen = new Set(existing.map((name) => name.toLowerCase()));

  for (const name of names) {
    if (!seen.has(name.toLowerCase())) {
      existing.push(name);
      seen.add(name.toLowerCase());
    }
  }

  headers.set("Vary", existing.join(", "));
}

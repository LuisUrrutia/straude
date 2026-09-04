import { getAgentMarkdown } from "@/lib/agent-content";

const MARKDOWN_HEADERS = {
  "Content-Type": "text/markdown; charset=utf-8",
  Vary: "Accept, Accept-Encoding",
  "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400",
};

function responseFor(request: Request, includeBody: boolean): Response {
  const pathname = new URL(request.url).searchParams.get("path") ?? "/";
  const markdown = getAgentMarkdown(pathname);

  if (!markdown) {
    return new Response(includeBody ? "# Page not found\n" : null, {
      status: 404,
      headers: {
        ...MARKDOWN_HEADERS,
        "Cache-Control": "no-store",
      },
    });
  }

  return new Response(includeBody ? markdown : null, {
    status: 200,
    headers: MARKDOWN_HEADERS,
  });
}

export function GET(request: Request): Response {
  return responseFor(request, true);
}

export function HEAD(request: Request): Response {
  return responseFor(request, false);
}

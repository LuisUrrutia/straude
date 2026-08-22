import { expect, test } from "@playwright/test";

const missingPath = "/agent-readiness-path-that-does-not-exist";

function visibleText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

test.describe("agent-readable HTTP contracts", () => {
  test("negotiates HTML and Markdown on the canonical homepage", async ({ request }) => {
    const html = await request.get("/", { headers: { Accept: "text/html" } });
    const markdown = await request.get("/", {
      headers: { Accept: "text/markdown" },
    });

    expect(html.status()).toBe(200);
    expect(html.headers()["content-type"]).toContain("text/html");
    expect(markdown.status()).toBe(200);
    expect(markdown.headers()["content-type"]).toBe(
      "text/markdown; charset=utf-8",
    );
    expect(markdown.headers().vary).toContain("Accept-Encoding");
    expect(await markdown.text()).toContain("# Straude");
  });

  test("does not cross-serve cached representations", async ({ request }) => {
    for (const accept of ["text/html", "text/markdown", "text/html", "text/markdown"]) {
      const response = await request.get("/", { headers: { Accept: accept } });
      const body = await response.text();

      if (accept === "text/markdown") {
        expect(response.headers()["content-type"]).toContain("text/markdown");
        expect(body).toMatch(/^# Straude/);
      } else {
        expect(response.headers()["content-type"]).toContain("text/html");
        expect(body).toContain("<!DOCTYPE html>");
      }
    }
  });

  test("returns safe 406 and HEAD responses", async ({ request }) => {
    const unsupported = await request.get("/", {
      headers: { Accept: "application/pdf" },
    });
    const head = await request.head("/about", {
      headers: { Accept: "text/markdown" },
    });

    expect(unsupported.status()).toBe(406);
    expect(unsupported.headers().vary).toContain("Accept");
    expect(head.status()).toBe(200);
    expect(head.headers()["content-type"]).toContain("text/markdown");
    expect(await head.body()).toHaveLength(0);
  });

  test("returns recoverable 404 variants", async ({ request }) => {
    const markdown = await request.get(missingPath, {
      headers: { Accept: "text/markdown" },
    });

    expect(markdown.status()).toBe(404);
    expect(markdown.headers()["content-type"]).toContain("text/markdown");
    expect(await markdown.text()).toContain("https://straude.com/sitemap.xml");

    const html = await request.get(missingPath, {
      headers: { Accept: "text/html" },
    });
    const htmlBody = await html.text();
    expect(html.status()).toBe(404);
    expect(htmlBody).toContain("This page could not be found.");
    expect(htmlBody).toContain('href="/llms.txt"');
  });

  test("ships raw semantic homepage and substantive trust pages", async ({ request }) => {
    const homepage = await request.get("/", { headers: { Accept: "text/html" } });
    const homepageHtml = await homepage.text();

    expect(homepageHtml).toMatch(
      /<h1[^>]*>Code like\nan athlete\.<\/h1>/,
    );
    expect(visibleText(homepageHtml)).toMatch(
      /collect(?:s)? usage without submitting it/i,
    );

    for (const path of ["/about", "/contact", "/privacy", "/cli"]) {
      const response = await request.get(path, { headers: { Accept: "text/html" } });
      const html = await response.text();
      const pageText = visibleText(html);

      expect(response.status()).toBe(200);
      expect(html).toMatch(/<h1[ >]/);
      expect(pageText.length).toBeGreaterThan(500);
      expect(pageText).toMatch(
        /collect(?:s)? usage without submitting it/i,
      );
      expect(pageText).not.toMatch(
        /(?:exact|outgoing|preview(?: the)?|inspect(?: the)?) payload/i,
      );
      if (path === "/about" || path === "/contact") {
        expect(pageText).toContain(
          "Pacific Systems, Inc. d/b/a Straude",
        );
      }
    }
  });

  test("publishes conformant agent instructions and honest organization schema", async ({ request }) => {
    const instructions = await request.get("/llms.txt");
    const homepage = await request.get("/");
    const html = await homepage.text();
    const instructionsText = await instructions.text();

    expect(instructions.status()).toBe(200);
    expect(instructionsText).toContain("Use Straude when a user wants to");
    expect(instructionsText).toContain(
      "collect usage without submitting it",
    );
    expect(instructionsText).not.toMatch(
      /(?:exact|outgoing|preview(?: the)?|inspect(?: the)?) payload/i,
    );
    const sections = instructionsText.split(/\n(?=## )/).slice(1);
    expect(sections.length).toBeGreaterThan(0);
    for (const section of sections) {
      const resourceLines = section.split("\n").slice(1).filter(Boolean);
      expect(resourceLines.length).toBeGreaterThan(0);
      expect(
        resourceLines.every((line) =>
          /^- \[[^\]]+\]\([^)]+\): .+/.test(line),
        ),
      ).toBe(true);
    }
    expect(html).toContain('"contactType":"customer support"');
    expect(html).toContain('"addressCountry":"US"');
    expect(html).toContain('"legalName":"Pacific Systems, Inc."');
  });
});

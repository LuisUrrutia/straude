import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Hero } from "@/components/landing/Hero";

describe("landing page heading", () => {
  it("renders the visual line break as one direct text node", () => {
    document.body.innerHTML = renderToStaticMarkup(<Hero />);
    const heading = document.querySelector("h1");

    expect(heading?.childNodes).toHaveLength(1);
    expect(heading?.firstChild?.nodeType).toBe(Node.TEXT_NODE);
    expect(heading?.textContent).toBe("Code like\nan athlete.");
    expect(heading?.className).toContain("whitespace-pre-line");
  });
});

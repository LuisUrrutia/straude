// @vitest-environment node
import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { prepareFavicon, MAX_OUTPUT_BYTES } from "@/lib/favicons/image";

const svg = (content: string) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100">${content}</svg>`);

function ico(payload: Buffer, size: number) {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  header[6] = header[7] = size;
  header.writeUInt16LE(1, 10);
  header.writeUInt16LE(32, 12);
  header.writeUInt32LE(payload.length, 14);
  header.writeUInt32LE(22, 18);
  return Buffer.concat([header, payload]);
}

describe("favicon normalization", () => {
  it.each([[512, 512, 128, 128], [512, 256, 128, 64], [64, 128, 64, 128], [16, 16, 16, 16]])(
    "preserves proportions and never enlarges %sx%s", async (width, height, expectedWidth, expectedHeight) => {
      const source = await sharp({ create: { width, height, channels: 4, background: { r: 100, g: 10, b: 240, alpha: 0.5 } } }).png().toBuffer();
      const result = await prepareFavicon(source);
      expect(result).toMatchObject({ format: "png", width: expectedWidth, height: expectedHeight });
      const metadata = await sharp(result!.bytes).metadata();
      expect(metadata).toMatchObject({ hasAlpha: true, isPalette: false });
      expect(result!.bytes.length).toBeLessThanOrEqual(MAX_OUTPUT_BYTES);
      if (width === expectedWidth && height === expectedHeight) {
        expect(await sharp(result!.bytes).raw().toBuffer()).toEqual(await sharp(source).raw().toBuffer());
      }
    },
  );

  it("preserves unresized RGBA noise without palette quantization", async () => {
    const pixels = Buffer.from(Array.from({ length: 128 * 128 * 4 }, (_, index) => (index * 97 + (index >> 5)) % 256));
    const source = await sharp(pixels, { raw: { width: 128, height: 128, channels: 4 } }).png().toBuffer();
    const result = await prepareFavicon(source);
    expect(await sharp(result!.bytes).raw().toBuffer()).toEqual(pixels);
  });

  it("keeps safe SVG paths, viewBox and local gradient styles as vector output", async () => {
    const result = await prepareFavicon(svg('<defs><linearGradient id="paint"><stop stop-color="red"/></linearGradient></defs><style>.logo{fill:url(#paint)}</style><path class="logo" d="M0 0h200v100H0z"/>'));
    expect(result?.format).toBe("svg");
    expect(result?.bytes.toString()).toContain('viewBox="0 0 200 100"');
    expect(result?.bytes.toString()).toContain("url(#paint)");
  });

  it("removes scripts, event handlers and foreignObject", async () => {
    const result = await prepareFavicon(svg('<script>alert(1)</script><foreignObject><div>unsafe</div></foreignObject><rect width="200" height="100" onclick="alert(1)"/>'));
    expect(result?.format).toBe("svg");
    expect(result?.bytes.toString()).not.toMatch(/script|onclick|foreignObject/);
  });

  it.each([
    '<image href="https://internal/logo.png"/>',
    '<use href="//internal/icon.svg#logo"/>',
    '<rect style="fill:url(https://internal/a)"/>',
    '<style>@import "https://internal/a";</style><rect/>',
    '<style>rect{background-image:image-set("https://internal/a")}</style><rect/>',
    '<rect fill="u\\72l(https://internal/a)"/>',
  ])("rejects SVG dependencies: %s", async (content) => {
    expect(await prepareFavicon(svg(content))).toBeNull();
  });

  it("rejects entities, processing instructions, malformed and excessively complex XML", async () => {
    for (const bytes of [
      Buffer.from('<!DOCTYPE svg [<!ENTITY x SYSTEM "file:///etc/passwd">]><svg xmlns="http://www.w3.org/2000/svg"><text>&x;</text></svg>'),
      Buffer.from('<?xml-stylesheet href="https://internal/style"?>' + svg('<rect/>')),
      svg('<g>'.repeat(40) + '<rect/>' + '</g>'.repeat(40)),
      svg('<path/>'.repeat(2050)),
      svg('<rect>'),
      svg(' '.repeat(MAX_OUTPUT_BYTES)),
    ]) expect(await prepareFavicon(bytes)).toBeNull();
  });

  it("decodes PNG-backed ICO entries", async () => {
    const png = await sharp({ create: { width: 32, height: 32, channels: 4, background: "red" } }).png().toBuffer();
    const result = await prepareFavicon(ico(png, 32));
    expect(result).toMatchObject({ format: "png", width: 32, height: 32 });
    expect(await sharp(result!.bytes).raw().toBuffer()).toEqual(await sharp(png).raw().toBuffer());
  });

  it("decodes BMP-backed ICO entries with transparency", async () => {
    const dib = Buffer.alloc(40 + 16 * 16 * 4 + 16 * 4);
    dib.writeUInt32LE(40, 0);
    dib.writeInt32LE(16, 4);
    dib.writeInt32LE(32, 8);
    dib.writeUInt16LE(1, 12);
    dib.writeUInt16LE(32, 14);
    for (let offset = 40; offset < 40 + 16 * 16 * 4; offset += 4) {
      dib[offset + 2] = 255;
      dib[offset + 3] = 128;
    }
    const result = await prepareFavicon(ico(dib, 16));
    expect(result).toMatchObject({ format: "png", width: 16, height: 16 });
    expect([...((await sharp(result!.bytes).raw().toBuffer()).subarray(0, 4))]).toEqual([255, 0, 0, 128]);
  });

  it("rejects corrupt, oversized and high-pixel-count sources", async () => {
    const large = await sharp({ create: { width: 4097, height: 4097, channels: 3, background: "red" } }).png().toBuffer();
    for (const bytes of [Buffer.from("not an image"), Buffer.alloc(4 * 1024 * 1024 + 1), large]) {
      expect(await prepareFavicon(bytes)).toBeNull();
    }
  });
});

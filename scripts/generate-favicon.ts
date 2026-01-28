#!/usr/bin/env bun
/**
 * Generate images using BFL FLUX model
 * Usage: BFL_API_KEY=xxx bun run scripts/generate-favicon.ts [--background]
 */

const BFL_API_KEY = process.env.BFL_API_KEY;
if (!BFL_API_KEY) {
  console.error("Missing BFL_API_KEY environment variable");
  process.exit(1);
}

const isBackground = process.argv.includes("--background");

const config = isBackground
  ? {
      prompt: `Wide cinematic photograph of a lone rock climber free soloing on El Capitan, Yosemite. Tiny human figure against massive granite wall. Golden hour light, dramatic scale, inspiring sense of adventure and determination. Shot from far away showing the immense vertical face. Professional landscape photography, high detail, awe-inspiring composition`,
      width: 1920,
      height: 1080,
      outputPath: "../public/hero-bg.jpg",
      model: "flux-pro-1.1-ultra",
    }
  : {
      prompt: `Isometric 3D icon of a cute friendly sea urchin character, minimal design, coral orange color (#C6603F), cream white background (#FAF9F5), clean vector style, soft rounded spines, simple expressive eyes, favicon style, no text, centered composition, studio lighting, high contrast`,
      width: 512,
      height: 512,
      outputPath: "../app/icon.png",
      model: "flux-pro-1.1",
    };

async function generateImage() {
  console.log(`Generating ${isBackground ? "background" : "favicon"}...`);
  console.log(`Prompt: ${config.prompt}\n`);

  // Submit request
  const submitRes = await fetch(`https://api.bfl.ai/v1/${config.model}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-key": BFL_API_KEY,
    },
    body: JSON.stringify({
      prompt: config.prompt,
      width: config.width,
      height: config.height,
      aspect_ratio: isBackground ? "16:9" : "1:1",
      safety_tolerance: 2,
    }),
  });

  if (!submitRes.ok) {
    const err = await submitRes.text();
    throw new Error(`Failed to submit: ${submitRes.status} ${err}`);
  }

  const submitData = await submitRes.json();
  const pollingUrl = submitData.polling_url || `https://api.bfl.ai/v1/get_result?id=${submitData.id}`;
  console.log(`Request ID: ${submitData.id}`);
  console.log(`Polling URL: ${pollingUrl}`);

  // Poll for result
  let result: { status: string; result?: { sample: string } } | null = null;
  while (true) {
    const pollRes = await fetch(pollingUrl, {
      headers: { "x-key": BFL_API_KEY },
    });

    if (!pollRes.ok) {
      throw new Error(`Poll failed: ${pollRes.status}`);
    }

    result = await pollRes.json();
    console.log(`Status: ${result.status}`);

    if (result.status === "Ready") break;
    if (result.status === "Error") throw new Error("Generation failed");

    await new Promise((r) => setTimeout(r, 1000));
  }

  const imageUrl = result.result?.sample;
  if (!imageUrl) throw new Error("No image URL in result");

  console.log(`Downloading: ${imageUrl}`);

  // Download image
  const imageRes = await fetch(imageUrl);
  const imageBuffer = await imageRes.arrayBuffer();

  const outputPath = new URL(config.outputPath, import.meta.url).pathname;
  await Bun.write(outputPath, imageBuffer);
  console.log(`Saved: ${outputPath}`);

  console.log("\nDone!");
}

generateImage().catch((e) => {
  console.error(e);
  process.exit(1);
});

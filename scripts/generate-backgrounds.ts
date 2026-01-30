/**
 * Generate endurance sport themed backgrounds using BFL FLUX.2
 *
 * Usage: BFL_API_KEY=your_key bun run scripts/generate-backgrounds.ts
 *
 * Requires: BFL_API_KEY environment variable
 * API Docs: https://docs.bfl.ml/flux_2/flux2_text_to_image
 */

const BFL_API_KEY = process.env.BFL_API_KEY;

if (!BFL_API_KEY) {
  console.error('Error: BFL_API_KEY environment variable is required');
  console.error('Get your API key from https://bfl.ai/');
  process.exit(1);
}

const prompts = [
  // 1. Trail running
  'Black and white photograph of a lone trail runner on a mountain ridge at dawn, silhouette against misty peaks, minimalist composition with large empty sky, dramatic lighting, no text, motivational atmosphere, high contrast',
  // 2. Cycling
  'Black and white photograph of a cyclist riding on an empty coastal road, shot from behind, vast ocean horizon, minimalist composition with negative space in sky, cinematic lighting, no text, inspirational mood',
  // 3. Swimming
  'Black and white underwater photograph of a swimmer mid-stroke, abstract light rays through water surface, minimalist composition with dark empty space, no text, powerful and serene atmosphere',
  // 4. Marathon/Running
  'Black and white photograph of empty running track lanes stretching into foggy distance, dramatic perspective, large empty sky area, minimalist composition, no text, motivational atmosphere, early morning light',
  // 5. Hiking/Mountaineering
  'Black and white photograph of hiking boots on rocky mountain summit overlooking cloud-covered valleys below, vast empty sky, minimalist composition, no text, sense of achievement and solitude',
];

const API_ENDPOINT = 'https://api.bfl.ai/v1/flux-2-pro';

interface GenerateResponse {
  id: string;
  polling_url: string;
}

interface PollResponse {
  id: string;
  status: 'Pending' | 'Processing' | 'Ready' | 'Failed' | 'Error';
  result?: {
    sample: string; // URL to the generated image
  };
}

async function generateImage(prompt: string, index: number): Promise<string | null> {
  console.log(`\n[${index + 1}/5] Generating: "${prompt.slice(0, 60)}..."`);

  try {
    // Submit generation request
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'x-key': BFL_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        width: 640,
        height: 640,
        output_format: 'jpeg',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`  Error submitting: ${error}`);
      return null;
    }

    const data: GenerateResponse = await response.json();
    console.log(`  Submitted, polling for result...`);

    // Poll for result
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds max

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const pollResponse = await fetch(data.polling_url, {
        headers: {
          'accept': 'application/json',
          'x-key': BFL_API_KEY!,
        },
      });

      if (!pollResponse.ok) {
        attempts++;
        continue;
      }

      const pollData: PollResponse = await pollResponse.json();

      if (pollData.status === 'Ready' && pollData.result?.sample) {
        console.log(`  Completed!`);
        return pollData.result.sample;
      } else if (pollData.status === 'Failed' || pollData.status === 'Error') {
        console.error(`  Generation failed`);
        return null;
      }

      attempts++;
      if (attempts % 5 === 0) {
        console.log(`  Still processing... (${attempts}s)`);
      }
    }

    console.error(`  Timeout waiting for generation`);
    return null;
  } catch (error) {
    console.error(`  Error: ${error}`);
    return null;
  }
}

async function downloadImage(url: string, filepath: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    if (!response.ok) return false;

    const buffer = await response.arrayBuffer();
    await Bun.write(filepath, buffer);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log('='.repeat(50));
  console.log('BFL FLUX.2 Background Generator');
  console.log('='.repeat(50));

  const outputDir = './public/backgrounds';

  for (let i = 0; i < prompts.length; i++) {
    const imageUrl = await generateImage(prompts[i], i);

    if (imageUrl) {
      const filepath = `${outputDir}/sport-${i + 1}.jpg`;
      const success = await downloadImage(imageUrl, filepath);

      if (success) {
        console.log(`  Saved to ${filepath}`);
      } else {
        console.error(`  Failed to save image`);
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('Generation complete!');
  console.log('='.repeat(50));
}

main();

const BFL_API_KEY = process.env.BFL_API_KEY;

if (!BFL_API_KEY) {
  console.error("BFL_API_KEY not set");
  process.exit(1);
}

const prompt = `A dark, moody screenshot of a software leaderboard interface showing developer statistics and rankings. The UI displays usernames, session counts, lines of code, and ranking numbers in a minimal dark theme. Rows show data like "user_abc: 847 sessions, 12.4k lines" with subtle orange accent highlights. The interface has a modern, clean aesthetic with monospace fonts and dark gray background. Professional software dashboard aesthetic, no faces or people visible.`;

async function generateImage() {
  console.log("Submitting generation request...");

  const response = await fetch("https://api.bfl.ai/v1/flux-pro-1.1", {
    method: "POST",
    headers: {
      accept: "application/json",
      "x-key": BFL_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      width: 1440,
      height: 832,
    }),
  });

  const data = await response.json();
  console.log("Request submitted:", data);

  const pollingUrl = data.polling_url;

  // Poll for result
  while (true) {
    await Bun.sleep(1000);

    const result = await fetch(pollingUrl, {
      headers: {
        accept: "application/json",
        "x-key": BFL_API_KEY!,
      },
    }).then((r) => r.json());

    console.log("Status:", result.status);

    if (result.status === "Ready") {
      const imageUrl = result.result.sample;
      console.log("Image URL:", imageUrl);

      // Download and save
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      await Bun.write("public/leaderboard-bg.jpg", imageBuffer);
      console.log("Saved to public/leaderboard-bg.jpg");
      break;
    } else if (result.status === "Error" || result.status === "Failed") {
      console.error("Generation failed:", result);
      break;
    }
  }
}

generateImage();

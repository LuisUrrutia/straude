import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";
export const alt = "Straude - Strava for Claude Code";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const imageData = await readFile(join(process.cwd(), "public/hero-bg.jpg"));
  const base64Image = `data:image/jpeg;base64,${imageData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Background image */}
        <img
          src={base64Image}
          alt=""
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />

        {/* Strong dark overlay for contrast */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            zIndex: 10,
            padding: 40,
          }}
        >
          {/* Title with strong shadow */}
          <div
            style={{
              fontSize: 180,
              fontWeight: 900,
              letterSpacing: "-0.03em",
              color: "#FFFFFF",
              textShadow: "0 4px 40px rgba(0, 0, 0, 0.8), 0 2px 10px rgba(0, 0, 0, 0.9)",
              lineHeight: 1,
            }}
          >
            STRAUDE
          </div>

          {/* Tagline - clear and simple */}
          <div
            style={{
              fontSize: 48,
              fontWeight: 600,
              color: "#FFFFFF",
              marginTop: 24,
              textShadow: "0 2px 20px rgba(0, 0, 0, 0.8)",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span style={{ color: "#FC4C02" }}>Strava</span>
            <span style={{ color: "rgba(255,255,255,0.7)" }}>for</span>
            <span style={{ color: "#D97757" }}>Claude Code</span>
          </div>

          {/* Hook/CTA */}
          <div
            style={{
              fontSize: 28,
              color: "rgba(255, 255, 255, 0.85)",
              marginTop: 32,
              textShadow: "0 2px 10px rgba(0, 0, 0, 0.7)",
              fontWeight: 400,
            }}
          >
            Track sessions • Share progress • Compete with friends
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

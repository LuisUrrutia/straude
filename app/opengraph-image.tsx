import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";
export const alt = "Straude - Strava for Claude Code";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  // Load the hero background image
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

        {/* Dark overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(17, 17, 17, 0.7)",
          }}
        />

        {/* Gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(17, 17, 17, 1), rgba(17, 17, 17, 0.5), rgba(17, 17, 17, 0.3))",
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
          }}
        >
          {/* Title */}
          <div
            style={{
              fontSize: 140,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "#F5F5F5",
              textShadow: "0 4px 30px rgba(198, 96, 63, 0.4)",
            }}
          >
            STRAUDE
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 36,
              color: "#A3A3A3",
              marginTop: 16,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span
              style={{
                color: "#F5F5F5",
                fontWeight: 500,
                borderBottom: "2px solid rgba(198, 96, 63, 0.5)",
                paddingBottom: 2,
              }}
            >
              Stra
            </span>
            <span>va for Cl</span>
            <span
              style={{
                color: "#F5F5F5",
                fontWeight: 500,
                borderBottom: "2px solid rgba(198, 96, 63, 0.5)",
                paddingBottom: 2,
              }}
            >
              aude
            </span>
            <span> Code</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

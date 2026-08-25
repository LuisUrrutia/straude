import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import {
  CCUSAGE_MIN_VERSION,
  _resetCcusageResolver,
  collectCcusageUsageAsync,
} from "../src/lib/ccusage.js";

const FIXTURE_ROOT = fileURLToPath(new URL("./fixtures/ccusage-gpt-5.6", import.meta.url));
const ISOLATED_SOURCE_ENV = [
  "CLAUDE_CONFIG_DIR",
  "OPENCODE_DATA_DIR",
  "AMP_DATA_DIR",
  "DROID_SESSIONS_DIR",
  "CODEBUFF_DATA_DIR",
  "HERMES_HOME",
  "PI_AGENT_DIR",
  "GOOSE_PATH_ROOT",
  "OPENCLAW_DIR",
  "KILO_DATA_DIR",
  "KIMI_DATA_DIR",
  "QWEN_DATA_DIR",
  "GEMINI_DATA_DIR",
];

const originalEnvironment = new Map<string, string | undefined>();

function comparableVersion(version: string): number {
  const [major = 0, minor = 0, patch = 0] = version.split(".").map(Number);
  return major * 1_000_000 + minor * 1_000 + patch;
}

beforeAll(() => {
  originalEnvironment.set("HOME", process.env.HOME);
  originalEnvironment.set("CODEX_HOME", process.env.CODEX_HOME);
  process.env.HOME = FIXTURE_ROOT;
  process.env.CODEX_HOME = `${FIXTURE_ROOT}/codex`;

  for (const variable of ISOLATED_SOURCE_ENV) {
    originalEnvironment.set(variable, process.env[variable]);
    delete process.env[variable];
  }
  _resetCcusageResolver();
});

afterAll(() => {
  for (const [variable, value] of originalEnvironment) {
    if (value === undefined) delete process.env[variable];
    else process.env[variable] = value;
  }
  _resetCcusageResolver();
});

describe("bundled ccusage GPT-5.6 pricing", () => {
  it("logs Codex tokens and LiteLLM API spend for the complete GPT-5.6 family", async () => {
    const usage = await collectCcusageUsageAsync("20260709", "20260709", 10_000, {
      pricingMode: "online",
    });

    expect(comparableVersion(usage.version)).toBeGreaterThanOrEqual(
      comparableVersion(CCUSAGE_MIN_VERSION),
    );
    expect(usage.agents).toEqual(["codex"]);
    expect(usage.data).toHaveLength(1);

    const day = usage.data[0]!;
    expect(day).toMatchObject({
      date: "2026-07-09",
      agents: ["codex"],
      inputTokens: 320_000,
      cacheReadTokens: 80_000,
      cacheCreationTokens: 0,
      outputTokens: 40_000,
      reasoningOutputTokens: 0,
      totalTokens: 440_000,
    });

    // Every member of the GPT-5.6 family must resolve to a LiteLLM price.
    // The dollar amounts themselves are owned upstream and change without
    // notice, so assert that each model is priced rather than pinning rates.
    const expectedModels = ["gpt-5.6", "gpt-5.6-luna", "gpt-5.6-sol", "gpt-5.6-terra"];
    expect([...day.models].sort()).toEqual(expectedModels);
    expect(day.modelBreakdown).toHaveLength(expectedModels.length);

    const breakdowns = day.modelBreakdown ?? [];
    expect(breakdowns.map((breakdown) => breakdown.model).sort()).toEqual(expectedModels);
    for (const breakdown of breakdowns) {
      expect(breakdown.cost_usd, `${breakdown.model} is unpriced`).toBeGreaterThan(0);
    }

    const summedCost = breakdowns.reduce((total, breakdown) => total + breakdown.cost_usd, 0);
    expect(day.costUSD).toBeCloseTo(summedCost, 10);
    expect(usage.summary.totalCostUSD).toBeCloseTo(summedCost, 10);
  });
});

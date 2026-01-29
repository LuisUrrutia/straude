import pc from 'picocolors';
import { exec } from 'child_process';
import { promisify } from 'util';
import { submitUsage } from '../lib/api.js';
import { getToken } from '../lib/config.js';

const execAsync = promisify(exec);

interface UsageData {
  date: string;
  models?: string[];
  modelsUsed?: string[];
  inputTokens?: number;
  outputTokens?: number;
  cacheCreationTokens?: number;
  cacheReadTokens?: number;
  totalTokens?: number;
  costUSD?: number;
  totalCost?: number;
}

interface PushOptions {
  date?: string;
  dryRun?: boolean;
}

function getLocalDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function push(options: PushOptions = {}): Promise<void> {
  // Check if logged in
  if (!getToken()) {
    console.log(pc.red('Not logged in. Run `straude login` first.'));
    return;
  }

  const targetDate = options.date || getLocalDate();
  const formattedDate = targetDate.replace(/-/g, '');

  console.log(pc.cyan(`Reading Claude Code usage for ${targetDate}...`));

  try {
    // Run ccusage CLI and parse JSON output
    const cmd = `npx ccusage daily --since ${formattedDate} --until ${formattedDate} --json`;

    let stdout: string;
    let stderr: string;
    try {
      const result = await execAsync(cmd);
      stdout = result.stdout;
      stderr = result.stderr;
    } catch (execError) {
      const err = execError as { stdout?: string; stderr?: string; message?: string };
      console.log(pc.red('Error running ccusage:'));
      console.log(pc.dim(`Command: ${cmd}`));
      if (err.stderr) console.log(pc.dim(`stderr: ${err.stderr}`));
      if (err.message) console.log(pc.dim(`error: ${err.message}`));
      return;
    }

    if (stderr) {
      console.log(pc.dim(`ccusage stderr: ${stderr}`));
    }

    let usageData: UsageData[];
    try {
      const parsed = JSON.parse(stdout);
      // ccusage returns { daily: [...], totals: {...} } format
      if (Array.isArray(parsed.daily)) {
        usageData = parsed.daily;
      } else if (parsed.type === 'daily' && Array.isArray(parsed.data)) {
        usageData = parsed.data;
      } else if (Array.isArray(parsed.data)) {
        // Fallback for older format
        usageData = parsed.data;
      } else if (Array.isArray(parsed)) {
        usageData = parsed;
      } else {
        usageData = [];
      }
    } catch {
      console.log(pc.yellow('Failed to parse ccusage output.'));
      console.log(pc.dim(`Raw output: ${stdout.slice(0, 200)}`));
      return;
    }

    if (!usageData || usageData.length === 0) {
      console.log(pc.yellow('No usage data found for today.'));
      console.log(pc.dim('Make sure you have used Claude Code today.'));
      return;
    }

    const todayData = usageData.find((d) => d.date === targetDate);

    if (!todayData) {
      console.log(pc.yellow('No usage data found for today.'));
      return;
    }

    const models = todayData.models ?? todayData.modelsUsed ?? [];
    const totalCost = typeof todayData.costUSD === 'number'
      ? todayData.costUSD
      : typeof todayData.totalCost === 'number'
        ? todayData.totalCost
        : 0;
    const totalTokens = todayData.totalTokens ?? 0;
    const inputTokens = todayData.inputTokens ?? 0;
    const outputTokens = todayData.outputTokens ?? 0;
    const cacheCreationTokens = todayData.cacheCreationTokens ?? 0;
    const cacheReadTokens = todayData.cacheReadTokens ?? 0;

    console.log();
    console.log(pc.bold('Today\'s usage:'));
    console.log(`  Cost: ${pc.green(`$${totalCost.toFixed(2)}`)}`);
    console.log(`  Tokens: ${pc.cyan(formatNumber(totalTokens))}`);
    console.log(`  Models: ${pc.dim(models.length > 0 ? models.join(', ') : '—')}`);
    console.log();

    if (options.dryRun) {
      console.log(pc.yellow('Dry run - not submitting data.'));
      return;
    }

    console.log(pc.dim('Submitting to Straude...'));

    const result = await submitUsage({
      date: targetDate,
      data: {
        date: todayData.date,
        models,
        inputTokens,
        outputTokens,
        cacheCreationTokens,
        cacheReadTokens,
        totalTokens,
        costUSD: totalCost,
      },
      source: 'cli',
    });

    console.log(pc.green('✓ Usage submitted successfully!'));
    if (result.post_url) {
      console.log(pc.dim(`View your post: https://straude.com${result.post_url}`));
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Not authenticated')) {
      console.log(pc.red('Session expired. Run `straude login` to re-authenticate.'));
    } else {
      console.error(
        pc.red('Error pushing usage:'),
        error instanceof Error ? error.message : error
      );
    }
  }
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

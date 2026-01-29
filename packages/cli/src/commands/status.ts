import pc from 'picocolors';
import { getStatus } from '../lib/api.js';
import { getConfig, getToken } from '../lib/config.js';

export async function status(): Promise<void> {
  // Check if logged in
  if (!getToken()) {
    console.log(pc.red('Not logged in. Run `straude login` first.'));
    return;
  }

  const config = getConfig();

  console.log(pc.cyan('Fetching your Straude stats...'));
  console.log();

  try {
    const stats = await getStatus();

    console.log(pc.bold(`@${config.username || 'user'}`));
    console.log();
    console.log(`  🔥 Streak:      ${pc.green(stats.streak.toString())} days`);
    console.log(
      `  🏆 Global Rank: ${stats.rank ? pc.yellow(`#${stats.rank}`) : pc.dim('Not ranked')}`
    );
    console.log(`  💰 Total Spent: ${pc.cyan(`$${stats.total_spent.toFixed(2)}`)}`);
    console.log();
    console.log(pc.dim('View your full profile at https://straude.com/feed'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('Not authenticated')) {
      console.log(pc.red('Session expired. Run `straude login` to re-authenticate.'));
    } else {
      console.error(
        pc.red('Error fetching status:'),
        error instanceof Error ? error.message : error
      );
    }
  }
}

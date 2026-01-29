import pc from 'picocolors';
import open from 'open';
import { initAuth, pollAuth } from '../lib/api.js';
import { saveToken, getToken } from '../lib/config.js';

export async function login(): Promise<void> {
  // Check if already logged in
  const existingToken = getToken();
  if (existingToken) {
    console.log(pc.yellow('You are already logged in. Run `straude logout` to log out first.'));
    return;
  }

  console.log(pc.cyan('Initiating login...'));

  try {
    // Get device code
    const { code, verify_url } = await initAuth();

    console.log();
    console.log(pc.bold('Your verification code:'), pc.green(code));
    console.log();
    console.log('Opening browser to complete authentication...');
    console.log(pc.dim(`If browser doesn't open, visit: ${verify_url}`));
    console.log();

    // Open browser
    await open(verify_url);

    // Poll for completion
    console.log(pc.dim('Waiting for authentication...'));

    const maxAttempts = 60; // 5 minutes with 5 second intervals
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds

      const result = await pollAuth(code);

      if (result.status === 'completed' && result.token) {
        saveToken(result.token, result.username || 'user');
        console.log();
        console.log(pc.green('✓ Successfully logged in!'));
        if (result.username) {
          console.log(pc.dim(`Logged in as @${result.username}`));
        }
        return;
      }

      if (result.status === 'expired') {
        console.log(pc.red('✗ Authentication expired. Please try again.'));
        return;
      }

      attempts++;
      process.stdout.write('.');
    }

    console.log();
    console.log(pc.red('✗ Authentication timed out. Please try again.'));
  } catch (error) {
    console.error(pc.red('Error during login:'), error instanceof Error ? error.message : error);
  }
}

export async function logout(): Promise<void> {
  const { clearConfig } = await import('../lib/config.js');
  clearConfig();
  console.log(pc.green('✓ Logged out successfully.'));
}

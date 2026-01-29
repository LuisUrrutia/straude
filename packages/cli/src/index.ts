#!/usr/bin/env node

import { Command } from 'commander';
import { login, logout } from './commands/login.js';
import { push } from './commands/push.js';
import { status } from './commands/status.js';

const program = new Command();

program
  .name('straude')
  .description('Track and share your Claude Code usage')
  .version('0.1.0');

program
  .command('login')
  .description('Authenticate with Straude')
  .action(login);

program
  .command('logout')
  .description('Log out from Straude')
  .action(logout);

program
  .command('push')
  .description("Push today's Claude Code usage to Straude")
  .option('-d, --date <date>', 'Specify date (YYYY-MM-DD format, today only)')
  .option('--dry-run', 'Preview data without submitting')
  .action((options) => push(options));

program
  .command('status')
  .description('View your current streak and rank')
  .action(status);

program.parse();

const { spawn } = require('child_process');
const path = require('path');
const readline = require('readline');

const projectRoot = path.resolve(__dirname, '..');
const nodeExecutable = process.execPath;
const playwrightCli = path.join(projectRoot, 'node_modules', 'playwright', 'cli.js');

// Start the Playwright HTML report server.
const proc = spawn(
  nodeExecutable,
  [playwrightCli, 'show-report'],
  {
    cwd: projectRoot,
    stdio: 'ignore',
  }
);

console.log(`Playwright report server running at http://localhost:9323 (PID: ${proc.pid})`);
console.log('The server will keep running while you view the report.');
console.log('Press Enter in this terminal to stop the server.');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('', () => {
  proc.kill();
  rl.close();
  console.log('Report server stopped.');
});

proc.on('exit', (code) => {
  rl.close();
  process.exit(code ?? 0);
});

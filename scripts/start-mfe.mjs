import { spawn } from 'node:child_process';

const command = process.platform === 'win32' ? 'cmd.exe' : 'pnpm';
const args = process.platform === 'win32'
  ? ['/d', '/s', '/c', 'pnpm.cmd --dir apps/web dev']
  : ['--dir', 'apps/web', 'dev'];
const child = spawn(command, args, {
  cwd: process.cwd(),
  detached: true,
  stdio: 'ignore',
  windowsHide: false,
});

child.unref();
console.log('[mfe] processo Vite iniciado em http://localhost:5174');

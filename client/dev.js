import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const root = path.dirname(fileURLToPath(import.meta.url));
const fallbackEsbuild = path.resolve(root, '../scratch/esbuild.exe');
process.env.ESBUILD_BINARY_PATH = process.env.ESBUILD_BINARY_PATH || fallbackEsbuild;

const viteBin = path.resolve(root, '../node_modules/vite/bin/vite.js');
const child = spawn(process.execPath, [viteBin, ...process.argv.slice(2)], { stdio: 'inherit', env: process.env });
child.on('exit', (code) => process.exit(code ?? 0));

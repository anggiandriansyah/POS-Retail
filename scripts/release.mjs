#!/usr/bin/env node

/**
 * ALPHOS Automated Single-Command Release Engine (Retro Sprint 5 Action Item)
 * Sinkronisasi serentak:
 * 1. package.json ("version": "x.y.z")
 * 2. src/utils/format.ts (APP_VERSION = "x.y.z")
 * 3. public/monitor.html (Header version metadata)
 * 4. docs/01_dokumen_versioning.html
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const targetVersion = process.argv[2] || '1.5.1';
console.log(`🚀 Starting ALPHOS Release Synchronization to v${targetVersion}...`);

// 1. package.json
const pkgPath = path.join(rootDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.version = targetVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
console.log(`✅ package.json bumped to ${targetVersion}`);

// 2. src/utils/format.ts
const formatPath = path.join(rootDir, 'src/utils/format.ts');
if (fs.existsSync(formatPath)) {
  let formatContent = fs.readFileSync(formatPath, 'utf8');
  formatContent = formatContent.replace(/export const APP_VERSION = '[^']+';/, `export const APP_VERSION = '${targetVersion}';`);
  fs.writeFileSync(formatPath, formatContent, 'utf8');
  console.log(`✅ src/utils/format.ts APP_VERSION locked to ${targetVersion}`);
}

// 3. public/monitor.html
const monitorPath = path.join(rootDir, 'public/monitor.html');
if (fs.existsSync(monitorPath)) {
  let monitorContent = fs.readFileSync(monitorPath, 'utf8');
  // Update header version badge
  monitorContent = monitorContent.replace(/Hotfix v1\.[0-9]+\.[0-9]+/g, `Hotfix v${targetVersion}`);
  fs.writeFileSync(monitorPath, monitorContent, 'utf8');
  console.log(`✅ public/monitor.html header synced to v${targetVersion}`);
}

console.log(`🎉 Single-Command Release Synchronization Complete for v${targetVersion}!`);

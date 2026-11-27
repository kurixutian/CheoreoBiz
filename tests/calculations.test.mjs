import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Verify PWA and Vite SingleFile build artifacts
const distDir = path.resolve(process.cwd(), 'dist');
assert.ok(fs.existsSync(path.join(distDir, 'index.html')), 'dist/index.html should exist');
assert.ok(fs.existsSync(path.join(distDir, 'manifest.json')), 'dist/manifest.json should exist');
assert.ok(fs.existsSync(path.join(distDir, 'sw.js')), 'dist/sw.js should exist');
assert.ok(fs.existsSync(path.join(distDir, 'icon-192.png')), 'dist/icon-192.png should exist');
assert.ok(fs.existsSync(path.join(distDir, 'icon-512.png')), 'dist/icon-512.png should exist');

const html = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
assert.ok(html.includes('Cheoreo'), 'Bundled dist/index.html should include Cheoreo app code');
assert.ok(html.includes('manifest.json'), 'Bundled dist/index.html should link manifest.json');

console.log('All build and PWA artifact checks passed!');

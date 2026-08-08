#!/usr/bin/env node

// Rewrites only the ignored Workers deployment tree.  Repository pages retain
// relative image paths so GitHub Pages remains a working fallback during the
// transition; the Workers version loads public media from the R2 custom domain.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, relative, dirname, extname } from 'node:path';

const outputDir = resolve(process.argv[2] ?? '');
const mediaOrigin = 'https://media.eomoment.com/.cloudflare-media/';
const imageExtensions = new Set(['.avif', '.gif', '.jpg', '.jpeg', '.png', '.webp']);

if (!process.argv[2]) {
  throw new Error('Usage: rewrite-cloudflare-media-urls.mjs <deployment-directory>');
}

function mediaUrl(fromFile, candidate) {
  if (/^(?:https?:|data:|\/\/|#)/i.test(candidate)) return candidate;

  const withoutQuery = candidate.split(/[?#]/, 1)[0];
  if (!imageExtensions.has(extname(decodeURIComponent(withoutQuery)).toLowerCase())) {
    return candidate;
  }

  const localPath = resolve(dirname(fromFile), decodeURIComponent(withoutQuery));
  const relativePath = relative(outputDir, localPath);
  if (relativePath.startsWith('..') || !/^(assets\/images|photos_1)\//.test(relativePath)) {
    return candidate;
  }

  return mediaOrigin + relativePath.split('/').map(encodeURIComponent).join('/');
}

function rewriteHtml(file, contents) {
  return contents
    .replace(/\bsrc=(['"])([^'"]+)\1/g, (match, quote, value) =>
      `src=${quote}${mediaUrl(file, value)}${quote}`)
    .replace(/\bsrcset=(['"])([^'"]+)\1/g, (match, quote, value) => {
      const rewritten = value.split(',').map(part => {
        const trimmed = part.trim();
        const [url, ...descriptor] = trimmed.split(/\s+/);
        return [mediaUrl(file, url), ...descriptor].join(' ');
      }).join(', ');
      return `srcset=${quote}${rewritten}${quote}`;
    });
}

function rewriteGalleryScript(file, contents) {
  return contents.replace(/(base|responsiveBase):\s*(['"])([^'"]+)\2/g,
    (match, key, quote, value) => {
      const path = value.replace(/^\.\.\//, '');
      if (!/^(assets\/images|photos_1)\//.test(path)) return match;
      return `${key}: ${quote}${mediaOrigin}${path.split('/').map(encodeURIComponent).join('/')}${quote}`;
    });
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(async entry => {
    const file = resolve(directory, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  }))).flat();
}

const files = await walk(outputDir);
let rewrittenFiles = 0;
for (const file of files) {
  const fileExtension = extname(file).toLowerCase();
  if (fileExtension !== '.html' && !file.endsWith('/assets/js/galleries.js')) continue;

  const original = await readFile(file, 'utf8');
  const rewritten = fileExtension === '.html'
    ? rewriteHtml(file, original)
    : rewriteGalleryScript(file, original);
  if (rewritten !== original) {
    await writeFile(file, rewritten);
    rewrittenFiles += 1;
  }
}

console.log(`Rewrote media URLs in ${rewrittenFiles} deployment files.`);

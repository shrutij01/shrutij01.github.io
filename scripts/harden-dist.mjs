import { readdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const distDirectory = fileURLToPath(new URL('../dist/', import.meta.url));

// GitHub Pages cannot set response headers, so ship the policy in each HTML
// document. Remote styles are limited to the two providers used by the site;
// scripts may only come from this GitHub Pages origin.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "script-src-attr 'none'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
  "font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net",
  "img-src 'self' data:",
  "media-src 'self'",
  "connect-src 'self' https://raw.githubusercontent.com",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-src 'none'",
  "worker-src 'self'",
  "manifest-src 'self'",
  'upgrade-insecure-requests',
].join('; ');

const securityMeta = [
  `<meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy}">`,
  '<meta name="referrer" content="strict-origin-when-cross-origin">',
].join('');

const textExtensions = new Set(['.css', '.html', '.js', '.json', '.mjs', '.xml']);
const polyfillIoPattern = /(?:https?:)?\/\/(?:[^/"'\s>]+\.)?polyfill(?:-fastly)?\.io\b/i;
const remoteScriptPattern = /<script\b[^>]*\bsrc\s*=\s*["'](?:https?:)?\/\//i;

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  }));

  return nestedFiles.flat();
}

const files = await listFiles(distDirectory);
const textFiles = files.filter((file) => textExtensions.has(extname(file)));
const htmlFiles = files.filter((file) => extname(file) === '.html');

for (const file of textFiles) {
  const contents = await readFile(file, 'utf8');
  if (polyfillIoPattern.test(contents)) {
    throw new Error(`Blocked Polyfill.io reference in ${file}`);
  }
}

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');

  if (remoteScriptPattern.test(html)) {
    throw new Error(`Blocked third-party script source in ${file}`);
  }

  if (/http-equiv=["']Content-Security-Policy["']/i.test(html)) {
    throw new Error(`Unexpected pre-existing Content Security Policy in ${file}`);
  }

  const hardenedHtml = html.replace(
    /<meta\s+charset=(?:["'][^"']*["']|[^\s>]+)\s*\/?>/i,
    (charsetMeta) => `${charsetMeta}${securityMeta}`,
  );

  if (hardenedHtml === html) {
    throw new Error(`Could not place security policy in ${file}`);
  }

  await writeFile(file, hardenedHtml);
}

console.log(
  `Hardened ${htmlFiles.length} HTML files; no Polyfill.io or third-party script sources found.`,
);

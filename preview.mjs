import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname, sep } from 'node:path';
const root = resolve(fileURLToPath(new URL('.', import.meta.url)));
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.mjs':'text/javascript', '.json':'application/json', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp', '.svg':'image/svg+xml', '.ico':'image/x-icon', '.woff2':'font/woff2', '.ttf':'font/ttf', '.otf':'font/otf', '.pdf':'application/pdf' };
createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.startsWith('/work/trading-platform/')) pathname = pathname.replace('/work/trading-platform/', '/work/service-workspace/');
    const path = resolve(root, '.' + pathname);
    if ((path !== root && !path.startsWith(root + sep)) || pathname.split('/').some(p => p.startsWith('.'))) { res.writeHead(404).end(); return; }
    const candidates = [path, path + '.html', path + sep + 'index.html'];
    for (const file of candidates) {
      try {
        if (!(await stat(file)).isFile()) continue;
        res.writeHead(200, {'Content-Type': types[extname(file)] || 'application/octet-stream'});
        res.end(await readFile(file)); return;
      } catch (error) { if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error; }
    }
    res.writeHead(404).end('Not found');
  } catch { res.writeHead(400).end('Invalid request'); }
}).listen(8767, '127.0.0.1', () => console.log('Portfolio preview: http://127.0.0.1:8767'));

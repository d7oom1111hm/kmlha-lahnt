const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, 'dist');
const mime = {'.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.json':'application/json', '.svg':'image/svg+xml', '.ttf':'font/ttf'};
const server = http.createServer((req, res) => {
  let file;
  try {
    const url = new URL(req.url, 'http://localhost');
    let targetPath = decodeURIComponent(url.pathname);
    file = path.resolve(root, '.' + targetPath);
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      file = path.join(file, 'index.html');
    } else if (!fs.existsSync(file) && fs.existsSync(file + '.html')) {
      file = file + '.html';
    }
  } catch { res.writeHead(400).end(); return; }
  if (!file.startsWith(root + path.sep) || !fs.statSync(file, {throwIfNoEntry:false})?.isFile()) {
    res.writeHead(404).end();
    return;
  }
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).on('error', () => res.destroy()).pipe(res);
});
server.listen(Number(process.env.PORT || 4192), '127.0.0.1', () => {
  console.log('http://127.0.0.1:' + server.address().port);
});

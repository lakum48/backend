const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  // Определяем путь к файлу
  let filePath = path.join(__dirname, '../FromFront', req.url === '/' ? 'main.html' : req.url);
  const ext = path.extname(filePath);
  let contentType = 'text/html';

  // Определение типа контента
  switch (ext) {
    case '.css':
      contentType = 'text/css';
      break;
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.json':
      contentType = 'application/json';
      break;
    case '.png':
      contentType = 'image/png';
      break;
    case '.jpg':
      contentType = 'image/jpg';
      break;
    case '.gif':
      contentType = 'image/gif';
      break;
    default:
      contentType = 'text/html';
  }

  // Чтение и отправка файла
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Страница 404
        fs.readFile(path.join(__dirname, '../FromFront', '404.html'), (err, content) => {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end(content || '404 - Страница не найдена', 'utf-8');
        });
      } else {
        res.writeHead(500);
        res.end(`Ошибка сервера: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});

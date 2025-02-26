// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors'); // Подключаем cors

const app = express();
const PORT = 3000;

// Загрузка данных из JSON-файла
const productsPath = path.join(__dirname, 'products.json');
let products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

// Middleware для обработки JSON
app.use(express.json());

// Разрешаем запросы с любого источника (для разработки)
app.use(cors());

// Отдача статических файлов (HTML, CSS)
app.use(express.static(path.join(__dirname, '../frontend')));

// Маршрут для получения всех товаров
app.get('/api/products', (req, res) => {
    res.json(products);
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер каталога товаров запущен на http://localhost:${PORT}`);
});

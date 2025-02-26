const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors'); // Подключаем cors

const app = express();
const PORT = 8080;

// Разрешаем запросы с любого источника (для разработки)
app.use(cors());

// Загрузка данных из JSON-файла
const productsPath = path.join(__dirname, 'products.json');
let products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

// Middleware для обработки JSON
app.use(express.json());

// Добавление товара
app.post('/api/products', (req, res) => {
    const newProduct = req.body;
    products.push(newProduct);
    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
    res.status(201).json(newProduct);
});

// Редактирование товара по ID
app.put('/api/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const updatedProduct = req.body;

    products = products.map(product => 
        product.id === productId ? { ...product, ...updatedProduct } : product
    );

    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
    res.json(updatedProduct);
});

// Удаление товара по ID
app.delete('/api/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    products = products.filter(product => product.id !== productId);
    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
    res.status(204).send();
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Панель администратора запущена на http://localhost:${PORT}`);
});
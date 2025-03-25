const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { graphqlHTTP } = require('express-graphql');
const schema = require('./schema');

const app = express();
const PORT = 3000;

// Загрузка данных из JSON-файла
const productsPath = path.join(__dirname, 'products.json');
let products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, '../frontend')));

// REST API для товаров
app.get('/api/products', (req, res) => {
    res.json(products);
});

// GraphQL endpoint
app.use('/graphql', graphqlHTTP({
    schema,
    graphiql: true
}));

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер каталога товаров запущен на http://localhost:${PORT}`);
});
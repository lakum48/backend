const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8081 });

// Храним соединения администраторов и клиентов
const adminConnections = new Set();
const clientConnections = new Set();

wss.on('connection', (ws) => {
    console.log('Новое соединение установлено');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.type === 'admin') {
                adminConnections.add(ws);
                console.log('Администратор подключился');
            } else if (data.type === 'client') {
                clientConnections.add(ws);
                console.log('Клиент подключился');
                
                // Уведомляем администраторов
                notifyAdmins('Новый клиент подключился к чату');
            } else if (data.text) {
                // Пересылаем сообщения
                if (adminConnections.has(ws)) {
                    // Сообщение от администратора клиентам
                    sendToClients(data.text, 'admin');
                } else {
                    // Сообщение от клиента администраторам
                    sendToAdmins(data.text, 'client');
                }
            }
        } catch (e) {
            console.error('Ошибка обработки сообщения:', e);
        }
    });

    ws.on('close', () => {
        adminConnections.delete(ws);
        clientConnections.delete(ws);
        console.log('Соединение закрыто');
    });
});

function notifyAdmins(message) {
    adminConnections.forEach(admin => {
        admin.send(JSON.stringify({
            type: 'notification',
            message: message
        }));
    });
}

function sendToClients(text, from) {
    clientConnections.forEach(client => {
        client.send(JSON.stringify({
            type: 'message',
            from: from,
            text: text,
            timestamp: new Date().toISOString()
        }));
    });
}

function sendToAdmins(text, from) {
    adminConnections.forEach(admin => {
        admin.send(JSON.stringify({
            type: 'message',
            from: from,
            text: text,
            timestamp: new Date().toISOString()
        }));
    });
}

console.log('WebSocket сервер чата запущен на ws://localhost:8081');
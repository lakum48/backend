import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { DataSource } from 'typeorm';
import { User } from './entities/User';
import { DatabaseConnection } from './entities/DatabaseConnection';
import { AuthService } from './services/AuthService';
import { DatabaseService } from './services/DatabaseService';
import { DatabaseManager } from './config/database';
import { authRouter } from './routes/auth';
import dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config();

// Отладочный вывод
console.log('Database configuration:', {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USER,
  database: process.env.DB_NAME,
  // Не выводим пароль в лог
});

const app = express();
app.use(cors());
app.use(express.json());

// Initialize TypeORM
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5433'),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [User, DatabaseConnection],
  synchronize: true,
});

// Initialize services
let authService: AuthService;
let databaseService: DatabaseService;

async function startServer() {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('Database connection established');

    // Initialize services
    authService = new AuthService(AppDataSource.getRepository(User));
    databaseService = new DatabaseService(
      AppDataSource.getRepository(DatabaseConnection),
      DatabaseManager.getInstance()
    );

    // Use auth routes
    app.use('/api/auth', authRouter);

    // Database connection routes
    app.post('/api/connections', async (req, res) => {
      try {
        const user = await authService.validateToken(req.headers.authorization?.split(' ')[1] || '');
        const connection = await databaseService.createConnection(user.id, req.body);
        res.json(connection);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    app.get('/api/connections', async (req, res) => {
      try {
        const user = await authService.validateToken(req.headers.authorization?.split(' ')[1] || '');
        const connections = await databaseService.getConnections(user.id);
        res.json(connections);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Schema endpoint
    app.get('/api/connections/:id/schema', async (req, res) => {
      try {
        const user = await authService.validateToken(req.headers.authorization?.split(' ')[1] || '');
        const schema = await databaseService.getSchema(req.params.id);
        res.json(schema);
      } catch (error) {
        console.error('Schema retrieval error details:', {
          message: error.message,
          stack: error.stack
        });
        res.status(500).json({ error: error.message });
      }
    });

    // Query endpoint
    app.post('/api/connections/:id/query', async (req, res) => {
      try {
        const user = await authService.validateToken(req.headers.authorization?.split(' ')[1] || '');
        const { query, params = [] } = req.body;
        const result = await databaseService.executeQuery(req.params.id, query, params);
        res.json(result);
      } catch (error) {
        console.error('Query execution error details:', {
          message: error.message,
          stack: error.stack
        });
        res.status(500).json({ error: error.message });
      }
    });

    // Start server
    app.listen(process.env.PORT || 4000, () => {
      console.log(`Server is running on port ${process.env.PORT || 4000}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer(); 
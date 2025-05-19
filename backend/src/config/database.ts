import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { DatabaseConnection } from '../entities/DatabaseConnection';
import { MongoClient } from 'mongodb';
import { Pool } from 'pg';
import mysql from 'mysql2/promise';

export interface DatabaseConfig {
  type: 'postgres' | 'mysql' | 'mongodb';
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export class DatabaseManager {
  private static instance: DatabaseManager;
  private connections: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  async connect(config: DatabaseConfig): Promise<any> {
    const connectionKey = `${config.type}-${config.host}-${config.database}`;
    
    if (this.connections.has(connectionKey)) {
      return this.connections.get(connectionKey);
    }

    let connection;
    switch (config.type) {
      case 'postgres':
        connection = new Pool({
          host: config.host,
          port: config.port,
          user: config.username,
          password: config.password,
          database: config.database,
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        });
        break;

      case 'mysql':
        connection = await mysql.createPool({
          host: config.host,
          port: config.port,
          user: config.username,
          password: config.password,
          database: config.database,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0
        });
        break;

      case 'mongodb':
        const mongoUrl = `mongodb://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`;
        connection = await MongoClient.connect(mongoUrl, {
          maxPoolSize: 10,
          minPoolSize: 1,
          maxIdleTimeMS: 30000
        });
        break;

      default:
        throw new Error(`Unsupported database type: ${config.type}`);
    }

    this.connections.set(connectionKey, connection);
    return connection;
  }

  async disconnect(connectionKey: string): Promise<void> {
    const connection = this.connections.get(connectionKey);
    if (connection) {
      try {
        if (connection instanceof Pool) {
          await connection.end();
        } else if (connection instanceof MongoClient) {
          await connection.close();
        } else if (typeof connection.end === 'function') {
          await connection.end();
        }
      } catch (error) {
        console.error('Error closing connection:', error);
      } finally {
        this.connections.delete(connectionKey);
      }
    }
  }

  async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.connections.keys()).map(key => this.disconnect(key));
    await Promise.all(disconnectPromises);
  }
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [User, DatabaseConnection],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts'],
}); 
import { Client } from 'pg';
import { MongoClient } from 'mongodb';
import { createConnection } from 'mysql2/promise';
import { DatabaseConnection } from '../entities/DatabaseConnection';

interface QueryResult {
  rows: any[];
  rowCount: number;
  fields?: any[];
}

export async function createDatabaseConnection(config: DatabaseConnection) {
  switch (config.type) {
    case 'postgres':
      return new Client({
        host: config.host,
        port: config.port,
        user: config.username,
        password: config.password,
        database: config.database
      });

    case 'mysql':
      return createConnection({
        host: config.host,
        port: config.port,
        user: config.username,
        password: config.password,
        database: config.database
      });

    case 'mongodb':
      const url = `mongodb://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`;
      return MongoClient.connect(url);

    default:
      throw new Error(`Unsupported database type: ${config.type}`);
  }
}

export async function executeQuery(connection: DatabaseConnection, query: string): Promise<QueryResult> {
  const db = await createDatabaseConnection(connection);

  try {
    switch (connection.type) {
      case 'postgres': {
        const client = db as Client;
        await client.connect();
        const result = await client.query(query);
        await client.end();
        return {
          rows: result.rows,
          rowCount: result.rowCount,
          fields: result.fields
        };
      }

      case 'mysql': {
        const conn = db as any;
        const [rows, fields] = await conn.execute(query);
        await conn.end();
        return {
          rows,
          rowCount: rows.length,
          fields
        };
      }

      case 'mongodb': {
        const client = db as MongoClient;
        const db = client.db(connection.database);
        const result = await db.eval(query);
        await client.close();
        return {
          rows: Array.isArray(result) ? result : [result],
          rowCount: Array.isArray(result) ? result.length : 1
        };
      }

      default:
        throw new Error(`Unsupported database type: ${connection.type}`);
    }
  } catch (error) {
    throw new Error(`Query execution failed: ${error.message}`);
  }
}

export async function getSchema(connection: DatabaseConnection) {
  const db = await createDatabaseConnection(connection);

  try {
    switch (connection.type) {
      case 'postgres': {
        const client = db as Client;
        await client.connect();
        const result = await client.query(`
          SELECT 
            table_name,
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns
          WHERE table_schema = 'public'
          ORDER BY table_name, ordinal_position;
        `);
        await client.end();
        return result.rows;
      }

      case 'mysql': {
        const conn = db as any;
        const [rows] = await conn.execute(`
          SELECT 
            TABLE_NAME as table_name,
            COLUMN_NAME as column_name,
            DATA_TYPE as data_type,
            IS_NULLABLE as is_nullable,
            COLUMN_DEFAULT as column_default
          FROM information_schema.columns
          WHERE table_schema = ?
          ORDER BY table_name, ordinal_position;
        `, [connection.database]);
        await conn.end();
        return rows;
      }

      case 'mongodb': {
        const client = db as MongoClient;
        const db = client.db(connection.database);
        const collections = await db.listCollections().toArray();
        const schema = [];

        for (const collection of collections) {
          const sample = await db.collection(collection.name).findOne();
          if (sample) {
            schema.push({
              table_name: collection.name,
              columns: Object.keys(sample).map(key => ({
                column_name: key,
                data_type: typeof sample[key],
                is_nullable: true,
                column_default: null
              }))
            });
          }
        }

        await client.close();
        return schema;
      }

      default:
        throw new Error(`Unsupported database type: ${connection.type}`);
    }
  } catch (error) {
    throw new Error(`Failed to get schema: ${error.message}`);
  }
} 
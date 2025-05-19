import { Repository } from 'typeorm';
import { DatabaseConnection } from '../entities/DatabaseConnection';
import { DatabaseManager, DatabaseConfig } from '../config/database';
import { SchemaTable, QueryResult } from '../types/app';

export class DatabaseService {
  constructor(
    private databaseConnectionRepository: Repository<DatabaseConnection>,
    private databaseManager: DatabaseManager
  ) {}

  async createConnection(
    userId: string,
    connectionData: Omit<DatabaseConnection, 'id' | 'user' | 'createdAt' | 'updatedAt'>
  ): Promise<DatabaseConnection> {
    const connection = this.databaseConnectionRepository.create({
      ...connectionData,
      user: { id: userId },
    });

    // Test the connection before saving
    await this.databaseManager.connect({
      type: connection.type,
      host: connection.host,
      port: connection.port,
      username: connection.username,
      password: connection.password,
      database: connection.database,
    });

    return this.databaseConnectionRepository.save(connection);
  }

  async getConnections(userId: string): Promise<DatabaseConnection[]> {
    return this.databaseConnectionRepository.find({
      where: { user: { id: userId } },
    });
  }

  async executeQuery(
    connectionId: string,
    query: string,
    params: any[] = []
  ): Promise<QueryResult[]> {
    const connection = await this.databaseConnectionRepository.findOne({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new Error('Database connection not found');
    }

    let dbConnection;
    try {
      dbConnection = await this.databaseManager.connect({
        type: connection.type,
        host: connection.host,
        port: connection.port,
        username: connection.username,
        password: connection.password,
        database: connection.database,
      });

      switch (connection.type) {
        case 'postgres':
        case 'mysql':
          try {
            const result = await dbConnection.query(query, params);
            // Обработка результатов для PostgreSQL и MySQL
            if (connection.type === 'postgres') {
              return result.rows || [];
            } else {
              // Для MySQL результат уже в нужном формате
              return Array.isArray(result[0]) ? result[0] : [result[0]];
            }
          } catch (error) {
            // Преобразуем ошибки PostgreSQL в более понятные сообщения
            const errorMessage = error.message || 'Unknown error occurred';
            if (errorMessage.includes('already exists')) {
              throw new Error('Таблица или объект с таким именем уже существует');
            } else if (errorMessage.includes('does not exist')) {
              throw new Error('Таблица или объект не существует');
            } else if (errorMessage.includes('syntax error')) {
              throw new Error('Ошибка синтаксиса SQL запроса');
            } else if (errorMessage.includes('permission denied')) {
              throw new Error('Недостаточно прав для выполнения операции');
            } else {
              throw new Error(`Ошибка выполнения запроса: ${errorMessage}`);
            }
          }

        case 'mongodb':
          try {
            const db = dbConnection.db(connection.database);
            const collection = query.split('.')[1];
            const operation = query.split('.')[0];
            const result = await db.collection(collection)[operation](params[0]);
            return [result];
          } catch (error) {
            throw new Error(`Ошибка выполнения MongoDB операции: ${error.message}`);
          }

        default:
          throw new Error(`Неподдерживаемый тип базы данных: ${connection.type}`);
      }
    } catch (error) {
      console.error('Query execution error:', error);
      throw error; // Пробрасываем уже обработанную ошибку дальше
    }
  }

  async getSchema(connectionId: string): Promise<SchemaTable[]> {
    const connection = await this.databaseConnectionRepository.findOne({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new Error('Database connection not found');
    }

    let dbConnection;
    try {
      dbConnection = await this.databaseManager.connect({
        type: connection.type,
        host: connection.host,
        port: connection.port,
        username: connection.username,
        password: connection.password,
        database: connection.database,
      });

      switch (connection.type) {
        case 'postgres':
          const tables = await dbConnection.query(`
            SELECT 
              t.table_name,
              c.column_name,
              c.data_type,
              c.is_nullable,
              CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary
            FROM information_schema.tables t
            JOIN information_schema.columns c ON t.table_name = c.table_name
            LEFT JOIN (
              SELECT kcu.table_name, kcu.column_name
              FROM information_schema.table_constraints tc
              JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
              WHERE tc.constraint_type = 'PRIMARY KEY'
            ) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
            WHERE t.table_schema = 'public'
            ORDER BY t.table_name, c.ordinal_position;
          `);
          
          // Преобразуем результаты в нужный формат
          const schemaMap = new Map<string, SchemaTable>();
          
          for (const row of tables.rows) {
            if (!schemaMap.has(row.table_name)) {
              schemaMap.set(row.table_name, {
                table_name: row.table_name,
                columns: []
              });
            }
            
            const table = schemaMap.get(row.table_name)!;
            table.columns.push({
              name: row.column_name,
              type: row.data_type,
              is_nullable: row.is_nullable === 'YES',
              is_primary: row.is_primary
            });
          }
          
          return Array.from(schemaMap.values());

        case 'mysql':
          const mysqlTables = await dbConnection.query(`
            SELECT 
              t.table_name,
              c.column_name,
              c.data_type,
              c.is_nullable,
              CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary
            FROM information_schema.tables t
            JOIN information_schema.columns c ON t.table_name = c.table_name
            LEFT JOIN (
              SELECT kcu.table_name, kcu.column_name
              FROM information_schema.table_constraints tc
              JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
              WHERE tc.constraint_type = 'PRIMARY KEY'
            ) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
            WHERE t.table_schema = ?
            ORDER BY t.table_name, c.ordinal_position;
          `, [connection.database]);
          
          return this.formatMySQLSchema(mysqlTables[0]);

        case 'mongodb':
          const db = dbConnection.db(connection.database);
          const collections = await db.listCollections().toArray();
          const schema: SchemaTable[] = [];
          
          for (const collection of collections) {
            const sample = await db.collection(collection.name).findOne();
            schema.push({
              table_name: collection.name,
              columns: sample ? Object.keys(sample).map(key => ({
                name: key,
                type: typeof sample[key],
                is_nullable: true,
                is_primary: false
              })) : []
            });
          }
          
          return schema;

        default:
          throw new Error(`Unsupported database type: ${connection.type}`);
      }
    } catch (error) {
      console.error('Schema retrieval error:', error);
      throw new Error(`Schema retrieval failed: ${error.message}`);
    }
  }

  private formatPostgresSchema(tables: any[]): SchemaTable[] {
    const schemaMap = new Map<string, SchemaTable>();
    
    for (const table of tables) {
      if (!schemaMap.has(table.table_name)) {
        schemaMap.set(table.table_name, {
          table_name: table.table_name,
          columns: []
        });
      }
      
      const schemaTable = schemaMap.get(table.table_name)!;
      schemaTable.columns.push({
        name: table.column_name,
        type: table.data_type,
        is_nullable: table.is_nullable === 'YES',
        is_primary: table.is_primary
      });
    }
    
    return Array.from(schemaMap.values());
  }

  private formatMySQLSchema(tables: any[]): SchemaTable[] {
    const schemaMap = new Map<string, SchemaTable>();
    
    for (const table of tables) {
      if (!schemaMap.has(table.table_name)) {
        schemaMap.set(table.table_name, {
          table_name: table.table_name,
          columns: []
        });
      }
      
      const schemaTable = schemaMap.get(table.table_name)!;
      schemaTable.columns.push({
        name: table.column_name,
        type: table.data_type,
        is_nullable: table.is_nullable === 'YES',
        is_primary: table.is_primary
      });
    }
    
    return Array.from(schemaMap.values());
  }
} 
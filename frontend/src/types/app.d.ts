export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface DatabaseConnection {
  id: string;
  name: string;
  type: 'postgres' | 'mysql' | 'mongodb';
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  schema?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface QueryResult {
  [key: string]: any;
}

export interface SchemaColumn {
  name: string;
  type: string;
  nullable: boolean;
}

export interface SchemaTable {
  [key: string]: SchemaColumn[];
} 
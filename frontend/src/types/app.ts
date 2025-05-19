export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface DatabaseConnection {
  id: number;
  name: string;
  type: 'postgres' | 'mysql' | 'mongodb';
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export interface QueryResult {
  [key: string]: any;
}

export interface SchemaTable {
  table_name: string;
  columns: {
    name: string;
    type: string;
    is_nullable: boolean;
    is_primary: boolean;
  }[];
} 
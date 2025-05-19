export interface SchemaTable {
  table_name: string;
  columns: {
    name: string;
    type: string;
    is_nullable: boolean;
    is_primary: boolean;
  }[];
}

export type QueryResult = Record<string, any>; 
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import { QueryResult, SchemaTable } from '../types/app';

const DatabaseConnection: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  const { data: schema, isLoading: schemaLoading } = useQuery<SchemaTable[]>({
    queryKey: ['schema', id],
    queryFn: async (): Promise<SchemaTable[]> => {
      const response = await axios.get<SchemaTable[]>(`${process.env.REACT_APP_API_URL}/api/database/schema/${id}`);
      return response.data;
    },
  });

  const executeQueryMutation = useMutation<QueryResult[], Error, string>({
    mutationFn: async (query: string): Promise<QueryResult[]> => {
      const response = await axios.post<QueryResult[]>(`${process.env.REACT_APP_API_URL}/api/database/query`, {
        connectionId: id,
        query,
      });
      return response.data;
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeQueryMutation.mutate(query);
  };

  if (schemaLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Execute Query
            </Typography>
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your SQL query here..."
                sx={{ mb: 2 }}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={executeQueryMutation.isPending}
              >
                {executeQueryMutation.isPending ? <CircularProgress size={24} /> : 'Execute'}
              </Button>
            </form>
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            {executeQueryMutation.data && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Results
                </Typography>
                <pre>{JSON.stringify(executeQueryMutation.data, null, 2)}</pre>
              </Box>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Database Schema
            </Typography>
            {schema?.map((table) => (
              <Box key={table.table_name} sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {table.table_name}
                </Typography>
                <Box component="ul" sx={{ pl: 2 }}>
                  {table.columns.map((column) => (
                    <li key={column.name}>
                      {column.name} ({column.type})
                      {column.is_primary && ' (PK)'}
                      {!column.is_nullable && ' (NOT NULL)'}
                    </li>
                  ))}
                </Box>
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DatabaseConnection; 
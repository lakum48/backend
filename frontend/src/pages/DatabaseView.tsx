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
  Tabs,
  Tab,
} from '@mui/material';
import { QueryResult, SchemaTable } from '../types/app';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const DatabaseView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [query, setQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [queryResult, setQueryResult] = useState<QueryResult[]>([]);
  const [error, setError] = useState('');

  const { data: schema, isLoading: schemaLoading } = useQuery<SchemaTable[]>({
    queryKey: ['schema', id],
    queryFn: async (): Promise<SchemaTable[]> => {
      const token = localStorage.getItem('token');
      console.log('Schema request token:', token);
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await axios.get<SchemaTable[]>(`${process.env.REACT_APP_API_URL}/api/connections/${id}/schema`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    },
  });

  const executeQuery = useMutation<QueryResult[], Error, string>({
    mutationFn: async (query: string): Promise<QueryResult[]> => {
      const token = localStorage.getItem('token');
      console.log('Query request token:', token);
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await axios.post<QueryResult[]>(`${process.env.REACT_APP_API_URL}/api/connections/${id}/query`, {
        query,
        params: []
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    },
    onSuccess: (data: QueryResult[]) => {
      setQueryResult(data);
      setError('');
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeQuery.mutate(query);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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
      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Query" />
          <Tab label="Schema" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
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
              disabled={executeQuery.isPending}
            >
              {executeQuery.isPending ? <CircularProgress size={24} /> : 'Execute'}
            </Button>
          </form>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {queryResult.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Results
              </Typography>
              <pre>{JSON.stringify(queryResult, null, 2)}</pre>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
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
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default DatabaseView; 
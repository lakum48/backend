import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { DatabaseConnection } from '../types/app';

interface ConnectionFormData {
  name: string;
  type: 'postgres' | 'mysql' | 'mongodb';
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<ConnectionFormData>({
    name: '',
    type: 'postgres',
    host: '',
    port: 5432,
    username: '',
    password: '',
    database: '',
  });

  const { data: connections = [] } = useQuery<DatabaseConnection[]>({
    queryKey: ['connections'],
    queryFn: async (): Promise<DatabaseConnection[]> => {
      const response = await axios.get<DatabaseConnection[]>('http://localhost:4000/api/connections');
      return response.data;
    },
  });

  const createConnection = useMutation<DatabaseConnection, Error, ConnectionFormData>({
    mutationFn: async (data: ConnectionFormData): Promise<DatabaseConnection> => {
      const response = await axios.post<DatabaseConnection>('http://localhost:4000/api/connections', data);
      return response.data;
    },
  });

  const deleteConnection = useMutation<void, Error, number>({
    mutationFn: async (id: number): Promise<void> => {
      await axios.delete(`http://localhost:4000/api/connections/${id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createConnection.mutate(formData, {
      onSuccess: () => {
        setOpen(false);
        setFormData({
          name: '',
          type: 'postgres',
          host: '',
          port: 5432,
          username: '',
          password: '',
          database: '',
        });
      },
    });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Welcome, {user?.name}!
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
        >
          New Connection
        </Button>
      </Box>

      <Grid container spacing={3}>
        {connections.map((connection) => (
          <Grid item xs={12} sm={6} md={4} key={connection.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {connection.name}
                </Typography>
                <Typography color="textSecondary">
                  {connection.type.toUpperCase()} - {connection.host}:{connection.port}/{connection.database}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  onClick={() => navigate(`/database/${connection.id}`)}
                >
                  Connect
                </Button>
                <IconButton
                  size="small"
                  onClick={() => deleteConnection.mutate(connection.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>New Database Connection</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              fullWidth
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Type"
              select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'postgres' | 'mysql' | 'mongodb' })}
              margin="normal"
              required
              SelectProps={{
                native: true,
              }}
            >
              <option value="postgres">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="mongodb">MongoDB</option>
            </TextField>
            <TextField
              fullWidth
              label="Host"
              value={formData.host}
              onChange={(e) => setFormData({ ...formData, host: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Port"
              type="number"
              value={formData.port}
              onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Database"
              value={formData.database}
              onChange={(e) => setFormData({ ...formData, database: e.target.value })}
              margin="normal"
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              Create
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default Dashboard; 
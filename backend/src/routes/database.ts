import { Router } from 'express';
import { getRepository } from 'typeorm';
import { DatabaseConnection } from '../entities/DatabaseConnection';
import { authMiddleware } from '../middleware/auth';
import { createDatabaseConnection, executeQuery, getSchema } from '../services/database';

const router = Router();

// Get all database connections for the current user
router.get('/connections', authMiddleware, async (req, res) => {
  try {
    const connectionRepository = getRepository(DatabaseConnection);
    const connections = await connectionRepository.find({
      where: { user: { id: req.user!.userId } }
    });

    res.json(connections);
  } catch (error) {
    console.error('Get connections error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new database connection
router.post('/connections', authMiddleware, async (req, res) => {
  try {
    const connectionRepository = getRepository(DatabaseConnection);
    const connection = connectionRepository.create({
      ...req.body,
      user: { id: req.user!.userId }
    });

    await connectionRepository.save(connection);
    res.status(201).json(connection);
  } catch (error) {
    console.error('Create connection error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Test database connection
router.post('/test-connection', authMiddleware, async (req, res) => {
  try {
    const connection = await createDatabaseConnection(req.body);
    await connection.connect();
    await connection.end();

    res.json({ message: 'Connection successful' });
  } catch (error) {
    console.error('Test connection error:', error);
    res.status(400).json({ message: 'Connection failed', error: error.message });
  }
});

// Execute query
router.post('/query', authMiddleware, async (req, res) => {
  try {
    const { connectionId, query } = req.body;
    const connectionRepository = getRepository(DatabaseConnection);
    const connection = await connectionRepository.findOne({
      where: { id: connectionId, user: { id: req.user!.userId } }
    });

    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    const result = await executeQuery(connection, query);
    res.json(result);
  } catch (error) {
    console.error('Query execution error:', error);
    res.status(500).json({ message: 'Query execution failed', error: error.message });
  }
});

// Get database schema
router.get('/schema/:connectionId', authMiddleware, async (req, res) => {
  try {
    const connectionRepository = getRepository(DatabaseConnection);
    const connection = await connectionRepository.findOne({
      where: { id: req.params.connectionId, user: { id: req.user!.userId } }
    });

    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    const schema = await getSchema(connection);
    res.json(schema);
  } catch (error) {
    console.error('Get schema error:', error);
    res.status(500).json({ message: 'Failed to get schema', error: error.message });
  }
});

export const databaseRouter = router; 
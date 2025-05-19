import { Router } from 'express';
import { User } from '../entities/User';
import { sign, SignOptions } from 'jsonwebtoken';
import { authMiddleware } from '../middleware/auth';
import { AuthService } from '../services/AuthService';
import { AppDataSource } from '../index';

const router = Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const authService = new AuthService(userRepository);
    const user = await authService.register(req.body);
    const token = sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as SignOptions
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const authService = new AuthService(userRepository);
    const { token, user } = await authService.login(req.body.email, req.body.password);
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: req.user.userId } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export const authRouter = router; 
import { Repository } from 'typeorm';
import { User } from '../entities/User';
import * as jwt from 'jsonwebtoken';

export class AuthService {
  constructor(private userRepository: Repository<User>) {}

  async register(userData: {
    email: string;
    password: string;
    name: string;
  }): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const user = this.userRepository.create({
      email: userData.email,
      password: userData.password,
      name: userData.name
    });
    await user.hashPassword();
    return this.userRepository.save(user);
  }

  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      throw new Error('Invalid password');
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    return { token, user };
  }

  async validateToken(token: string): Promise<User> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
        userId: string;
      };
      const user = await this.userRepository.findOne({
        where: { id: decoded.userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
} 
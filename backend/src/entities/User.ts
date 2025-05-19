import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { DatabaseConnection } from './DatabaseConnection';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @OneToMany(() => DatabaseConnection, connection => connection.user)
  databaseConnections: DatabaseConnection[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
} 
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';

@Entity()
export class DatabaseConnection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  type: 'postgres' | 'mysql' | 'mongodb';

  @Column()
  host: string;

  @Column()
  port: number;

  @Column()
  username: string;

  @Column()
  password: string;

  @Column()
  database: string;

  @Column({ nullable: true })
  schema?: string;

  @ManyToOne(() => User, user => user.databaseConnections)
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 
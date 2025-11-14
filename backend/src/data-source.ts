// src/data-source.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from './users/user.entity';
import { Contact } from './contacts/contact.entity';

dotenv.config(); // Read .env

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [User, Contact],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});

// Export it as a default export so that the TypeORM CLI can read it
export default dataSource;

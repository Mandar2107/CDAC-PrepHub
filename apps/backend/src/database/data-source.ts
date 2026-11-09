import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from '../users/user.entity';

dotenv.config({ path: '../../.env' });

export default new DataSource({
  type: 'postgres',
  url: process.env['DATABASE_URL'],
  entities: [User],
  migrations: ['src/database/migrations/*{.ts,.js}'],
  synchronize: false,
  ssl: process.env['DATABASE_SSL'] === 'true' ? { rejectUnauthorized: true } : false,
});

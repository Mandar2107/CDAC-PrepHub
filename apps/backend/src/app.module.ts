import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import * as Joi from 'joi';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health/health.controller';
import { User } from './users/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '../../.env', validationSchema: Joi.object({ NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'), PORT: Joi.number().port().default(3000), WEB_ORIGIN: Joi.string().required(), DATABASE_URL: Joi.string().uri({ scheme: ['postgres', 'postgresql'] }).required(), JWT_ACCESS_SECRET: Joi.string().min(32).required(), JWT_ACCESS_TTL: Joi.string().default('15m'), JWT_REFRESH_SECRET: Joi.string().min(32).required(), JWT_REFRESH_TTL: Joi.string().default('7d'), REFRESH_COOKIE_SAME_SITE: Joi.string().valid('strict', 'lax', 'none').default('strict') }) }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    TypeOrmModule.forRootAsync({ useFactory: () => ({ type: 'postgres' as const, url: process.env['DATABASE_URL'], entities: [User], migrations: [__dirname + '/database/migrations/*{.ts,.js}'], synchronize: false, migrationsRun: false, ssl: process.env['DATABASE_SSL'] === 'true' ? { rejectUnauthorized: true } : false }) }),
    AuthModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}

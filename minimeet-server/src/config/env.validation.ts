import * as Joi from 'joi';

/**
 * Environment variables interface for type safety
 */
export interface EnvironmentVariables {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;

  // Database
  DB_HOST: string;
  DB_PORT: number;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_NAME: string;

  // JWT
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;

  // Redis
  REDIS_HOST: string;
  REDIS_PORT: number;

  // Session (optional, defaults to JWT_SECRET)
  SESSION_SECRET?: string;
}

/**
 * Joi validation schema for environment variables
 * Ensures all required configuration is present at startup
 */
export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3001),

  // Database - all required
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(3306),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),

  // JWT - secret must be strong in production
  JWT_SECRET: Joi.string()
    .min(32)
    .required()
    .messages({
      'string.min': 'JWT_SECRET must be at least 32 characters long',
      'any.required': 'JWT_SECRET is required',
    }),
  JWT_EXPIRES_IN: Joi.string().default('24h'),

  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),

  // Session - optional, defaults to JWT_SECRET if not provided
  SESSION_SECRET: Joi.string()
    .min(32)
    .optional()
    .messages({
      'string.min': 'SESSION_SECRET must be at least 32 characters long',
    }),
});

import * as Joi from 'joi';
import * as dotenv from 'dotenv';
import { logger } from 'src/logger/winston-logger';

dotenv.config();

const schema = Joi.object({
  PORT: Joi.number().default(3000),

  STRIPE_SECRET_KEY: Joi.string().required(),
  STRIPE_WEBHOOK_SECRET: Joi.string().required(),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  LOG_LEVEL: Joi.string().optional(),
}).options({
  abortEarly: false,
  allowUnknown: true,
});

const { error } = schema.validate(process.env, { allowUnknown: true });

if (error) {
  logger.error('Invalid environment configuration', {
    message: error.message,
    details: error.details,
  });
  throw new Error(`Environment validation error: ${error.message}`);
}

export const validationSchema = schema;

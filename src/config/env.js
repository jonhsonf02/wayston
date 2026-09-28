const { z } = require('zod');
require('dotenv').config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().optional(),
  JWT_ACCESS_SECRET: z.string().min(10, 'JWT_ACCESS_SECRET must be at least 10 characters'),
  JWT_REFRESH_SECRET: z.string().min(10, 'JWT_REFRESH_SECRET must be at least 10 characters'),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  FRONTEND_URL: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid or missing environment variables:');
  for (const issue of parsed.error.issues) {
    console.error(`   - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

module.exports = parsed.data;
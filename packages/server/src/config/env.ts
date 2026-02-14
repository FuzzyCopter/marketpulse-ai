import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Database
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'marketpulse',
    user: process.env.DB_USER || 'mpuser',
    password: process.env.DB_PASSWORD || 'devpassword',
  },

  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production',

  // Data Source
  dataSourceMode: (process.env.DATA_SOURCE_MODE || 'mock') as 'mock' | 'live',

  // AI Engine
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  aiEngineUrl: process.env.AI_ENGINE_URL || 'http://localhost:8000',
} as const;

const mongoose = require('mongoose');
const { Pool } = require('pg');
const Redis = require('ioredis');
const env = require('./env');

let pgPool = null;
let redisClient = null;
let redisEnabled = false;

async function connectMongo() {
  await mongoose.connect(env.MONGO_URI);
  console.log('✅ MongoDB (Atlas) connected');
}

async function connectPostgres() {
  pgPool = new Pool({ connectionString: env.DATABASE_URL });
  await pgPool.query('SELECT 1');
  console.log('✅ Postgres (Neon) connected');
  return pgPool;
}

async function connectRedis() {
  if (!env.REDIS_URL) {
    console.log('⚠️  Redis skipped — REDIS_URL not set (rate-limiting, caching, and Socket.IO scaling disabled for now)');
    return;
  }
  redisClient = new Redis(env.REDIS_URL);
  await new Promise((resolve, reject) => {
    redisClient.once('ready', resolve);
    redisClient.once('error', reject);
  });
  redisEnabled = true;
  console.log('✅ Redis (Upstash) connected');
  return redisClient;
}

async function connectAll() {
  await connectMongo();
  await connectPostgres();
  await connectRedis();
}

function getPgPool() {
  if (!pgPool) throw new Error('Postgres pool not initialized — call connectAll() first');
  return pgPool;
}

function getRedisClient() {
  if (!redisEnabled) return null;
  return redisClient;
}

function isRedisEnabled() {
  return redisEnabled;
}

module.exports = { connectAll, getPgPool, getRedisClient, isRedisEnabled };
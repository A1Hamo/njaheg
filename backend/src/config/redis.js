// ════════════════════════════════════════
// src/config/redis.js
// ════════════════════════════════════════
const { createClient } = require('redis');
const logger = require('../utils/logger');

let client;

async function connectRedis() {
  const redisOptions = {
    url: process.env.REDIS_URL,
    socket: { reconnectStrategy: r => Math.min(r * 100, 3000) },
  };
  if (process.env.REDIS_PASSWORD && process.env.REDIS_PASSWORD.trim() !== '') {
    redisOptions.password = process.env.REDIS_PASSWORD;
  } else {
    redisOptions.password = null; // Explicitly disable password auth
  }

  client = createClient(redisOptions);
  client.on('error', e => logger.error('Redis error:', e));
  await client.connect();
  logger.info('✅ Redis connected');
}

const getRedis   = ()               => client;
const cacheSet   = (k, v, ttl=300) => client.setEx(k, ttl, JSON.stringify(v));
const cacheGet   = async k          => { const v = await client.get(k); return v ? JSON.parse(v) : null; };
const cacheDel   = k                => client.del(k);
const cacheIncr  = (k, ttl=86400)  => client.incr(k).then(v => { client.expire(k, ttl); return v; });

module.exports = { connectRedis, getRedis, cacheSet, cacheGet, cacheDel, cacheIncr };

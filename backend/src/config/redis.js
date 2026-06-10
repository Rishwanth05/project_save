const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

redis.on('connect', () => console.log('[redis] Connected'));
redis.on('error', (err) => console.error('[redis] Error:', err.message));

async function getCache(key) {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

async function setCache(key, value, ttlSeconds) {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // ignore cache write failures
  }
}

module.exports = redis;
module.exports.getCache = getCache;
module.exports.setCache = setCache;

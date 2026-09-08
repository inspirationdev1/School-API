require("dotenv").config();

const { createClient } = require("redis");

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://127.0.0.1:6379",

  socket: {
    reconnectStrategy: false,
    connectTimeout: 3000,
  },
});

// Don't continuously print errors
redisClient.on("error", () => {
  // Intentionally ignored
});

const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }

    await redisClient.ping();

    console.log("✅ Redis connected");

    return true;
  } catch (error) {
    // Only print ONE message during startup
    console.log("⚠️ Redis is not running. Continuing without Redis.");

    return false;
  }
};

const isRedisConnected = () => {
  return redisClient.isReady;
};

module.exports = {
  redisClient,
  connectRedis,
  isRedisConnected,
};

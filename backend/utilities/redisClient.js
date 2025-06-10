import { createClient } from 'redis';

const redisClient = createClient({
  url: 'redis://localhost:6379' // Replace with Redis Cloud URL in production
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.connect();

export default redisClient;
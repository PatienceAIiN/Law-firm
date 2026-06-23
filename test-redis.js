const Redis = require('ioredis');
const redis = new Redis('redis://default:ojA8Y9zhv3MLb9qfCEJL4VQUFRF5zRfI@mice-lace-distinguished-57611.db.redis.io:19298');

redis.ping().then(res => {
  console.log('Redis ping result:', res);
  process.exit(0);
}).catch(err => {
  console.error('Redis error:', err);
  process.exit(1);
});

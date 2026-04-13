const { prisma } = require('./src/lib/prisma');

console.log('Available Prisma models:');
console.log(Object.keys(prisma).filter(k => typeof prisma[k] === 'object' && prisma[k] !== null));
process.exit(0);

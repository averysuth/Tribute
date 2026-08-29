import { prisma } from '@tribute/database';

import { buildApp } from './app.js';
import { env } from './config/env.js';

const server = buildApp();

try {
  await prisma.$connect();
  server.log.info('Database connection established');
} catch (error) {
  server.log.error(error, 'Failed to connect to the database');
  process.exit(1);
}

try {
  await server.listen({ port: env.PORT, host: '0.0.0.0' });
} catch (error) {
  server.log.error(error);
  process.exit(1);
}

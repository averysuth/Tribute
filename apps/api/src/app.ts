import Fastify from 'fastify';

import { env } from './config/env.js';
import { errorHandler } from './lib/error-handler.js';
import { authPlugin } from './modules/auth/auth.plugin.js';
import { userRoutes } from './modules/users/user.routes.js';

export function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      redact: {
        paths: ['req.headers.authorization', 'req.headers.cookie'],
        censor: '[REDACTED]',
      },
      ...(env.NODE_ENV === 'production'
        ? {}
        : {
            transport: {
              target: 'pino-pretty',
              options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
            },
          }),
    },
  });

  app.setErrorHandler(errorHandler);
  app.register(authPlugin);
  app.register(userRoutes, { prefix: '/api/v1/users' });

  app.get('/', async () => {
    return { service: 'tribute-api', status: 'running' };
  });

  return app;
}

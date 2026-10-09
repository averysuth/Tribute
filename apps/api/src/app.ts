import Fastify from 'fastify';

import { env } from './config/env.js';
import { errorHandler } from './lib/error-handler.js';
import { authPlugin } from './modules/auth/auth.plugin.js';
import { danceStyleRoutes } from './modules/dance-styles/dance-style.routes.js';
import { organizationEventRoutes, eventRoutes } from './modules/events/event.routes.js';
import { organizationRoutes } from './modules/organizations/organization.routes.js';
import { profileRoutes } from './modules/profiles/profile.routes.js';
import { userRoutes } from './modules/users/user.routes.js';

export function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'test' ? 'silent' : env.NODE_ENV === 'production' ? 'info' : 'debug',
      redact: {
        paths: ['req.headers.authorization', 'req.headers.cookie'],
        censor: '[REDACTED]',
      },
      ...(env.NODE_ENV === 'development' && {
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
  app.register(profileRoutes, { prefix: '/api/v1/profiles' });
  app.register(organizationRoutes, { prefix: '/api/v1/organizations' });
  app.register(organizationEventRoutes, { prefix: '/api/v1/organizations' });
  app.register(eventRoutes, { prefix: '/api/v1/events' });
  app.register(danceStyleRoutes, { prefix: '/api/v1/dance-styles' });

  app.get('/', async () => {
    return { service: 'tribute-api', status: 'running' };
  });

  return app;
}

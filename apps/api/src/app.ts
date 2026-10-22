import cors from '@fastify/cors';
import Fastify from 'fastify';

import { env } from './config/env.js';
import { errorHandler } from './lib/error-handler.js';
import { attendanceRoutes } from './modules/attendance/attendance.routes.js';
import { authPlugin } from './modules/auth/auth.plugin.js';
import { danceStyleRoutes } from './modules/dance-styles/dance-style.routes.js';
import { organizationEventRoutes, eventRoutes } from './modules/events/event.routes.js';
import { organizationFollowRoutes, userFollowRoutes } from './modules/follows/follow.routes.js';
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

  // The only browser client is the Expo web dev build, used for quick local
  // testing (Tribute targets iOS/Android — see PROJECT_SPEC.md §1). There are
  // no cookie-based credentials to protect against CSRF, so reflecting the
  // request origin is safe; scoped to non-production since a shipped API has
  // no legitimate browser caller to support.
  if (env.NODE_ENV !== 'production') {
    app.register(cors, {
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });
  }

  app.register(authPlugin);
  app.register(userRoutes, { prefix: '/api/v1/users' });
  app.register(userFollowRoutes, { prefix: '/api/v1/users' });
  app.register(profileRoutes, { prefix: '/api/v1/profiles' });
  app.register(organizationRoutes, { prefix: '/api/v1/organizations' });
  app.register(organizationEventRoutes, { prefix: '/api/v1/organizations' });
  app.register(organizationFollowRoutes, { prefix: '/api/v1/organizations' });
  app.register(eventRoutes, { prefix: '/api/v1/events' });
  app.register(attendanceRoutes, { prefix: '/api/v1/events' });
  app.register(danceStyleRoutes, { prefix: '/api/v1/dance-styles' });

  app.get('/', async () => {
    return { service: 'tribute-api', status: 'running' };
  });

  return app;
}

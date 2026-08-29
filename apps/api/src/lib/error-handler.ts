import { Prisma } from '@tribute/database';
import { ZodError } from '@tribute/validation';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { AppError } from './errors.js';

function handlePrismaError(error: Prisma.PrismaClientKnownRequestError, reply: FastifyReply): void {
  switch (error.code) {
    case 'P2002':
      reply.status(409).send({
        error: { code: 'CONFLICT', message: 'A record with these details already exists' },
      });
      return;
    case 'P2025':
      reply.status(404).send({
        error: { code: 'NOT_FOUND', message: 'Resource not found' },
      });
      return;
    case 'P2003':
      reply.status(400).send({
        error: { code: 'INVALID_REFERENCE', message: 'Referenced resource does not exist' },
      });
      return;
    default:
      reply.status(400).send({
        error: { code: 'DATABASE_ERROR', message: 'The request could not be processed' },
      });
  }
}

export function errorHandler(error: Error, request: FastifyRequest, reply: FastifyReply): void {
  if (error instanceof AppError) {
    reply.status(error.statusCode).send({
      error: { code: error.code, message: error.message },
    });
    return;
  }

  if (error instanceof ZodError) {
    reply.status(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request',
        details: error.flatten().fieldErrors,
      },
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    handlePrismaError(error, reply);
    return;
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    request.log.error(error);
    reply.status(503).send({
      error: { code: 'DATABASE_UNAVAILABLE', message: 'Database connection is unavailable' },
    });
    return;
  }

  request.log.error(error);
  reply.status(500).send({
    error: { code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' },
  });
}

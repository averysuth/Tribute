export interface AuthenticatedUser {
  id: string;
  email: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }

  interface FastifyInstance {
    authenticate: (request: FastifyRequest) => Promise<void>;
    tryAuthenticate: (request: FastifyRequest) => Promise<void>;
  }
}

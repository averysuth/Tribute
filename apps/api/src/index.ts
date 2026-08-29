import Fastify from 'fastify';

const server = Fastify({ logger: true });

server.get('/', async () => {
  return { service: 'tribute-api', status: 'running' };
});

const port = Number(process.env.PORT ?? 4000);

server.listen({ port, host: '0.0.0.0' }).catch((error) => {
  server.log.error(error);
  process.exit(1);
});

import { GraphQLServer } from 'graphql-yoga';
import expressSession from 'express-session';
import connectRedis from 'connect-redis';
import RedisStoreRateLimit from 'rate-limit-redis';
import RateLimit from 'express-rate-limit';

import createTypeormConn from './utils/createTypeormConn';
import genSchema from './utils/genSchema';
import { redisSessionPrefix, redisRateLimitPrefix } from './constants';
import redis from './redis';
import {
  port,
  host,
  environment,
  isProduction,
  sessionSecret,
  portClient,
  hostClient,
  isTest
} from '../config';

const RedisStoreSession = connectRedis(expressSession);

const startServer = async () => {
  const server = new GraphQLServer({
    schema: genSchema(),
    context: ({ request }) => ({
      redis,
      url: `${host}:${port}`,
      session: request.session,
      sessionID: request.sessionID
    })
  });

  const limiter = new RateLimit({
    store: new RedisStoreRateLimit({
      client: redis,
      prefix: redisRateLimitPrefix
    }),
    max: 100,
    delayMs: 0
  });

  const session = expressSession({
    store: new RedisStoreSession({
      client: redis,
      prefix: redisSessionPrefix
    }),
    name: 'qid',
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      maxAge: 1000 * 60 * 60 * 24 * 30
    }
  });

  server.express.use(limiter);

  server.express.use(session);

  const cors = {
    credentials: true,
    origin: isTest ? '*' : `${hostClient}${portClient}`
  };

  await createTypeormConn();

  const app = await server.start({ cors, port });

  console.log(`Server is running on ${host}:${port} ${environment}`);

  return app;
};

export default startServer;

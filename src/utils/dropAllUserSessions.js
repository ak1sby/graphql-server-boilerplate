import { userSessionIdPrefix, redisSessionPrefix } from '../constants';

export default async (userId, redis) => {
  const sessionIds = await redis.lrange(
    `${userSessionIdPrefix}${userId}`,
    0,
    -1
  );
  sessionIds.forEach(sessionID =>
    redis.del(`${redisSessionPrefix}${sessionID}`)
  );
  return null;
};

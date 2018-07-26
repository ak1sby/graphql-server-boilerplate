import { userSessionIdPrefix, redisSessionPrefix } from '../constants';

export default async (userId, redis) => {
  try {
    const sessionIds = await redis.lrange(
      `${userSessionIdPrefix}${userId}`,
      0,
      -1
    );
    sessionIds.forEach(sessionID =>
      redis.del(`${redisSessionPrefix}${sessionID}`)
    );
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

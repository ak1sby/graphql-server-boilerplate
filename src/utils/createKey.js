import { v4 } from 'uuid';
import { changePasswordPrefix } from '../constants';

export default async (email, userId, redis) => {
  const key = v4();

  await redis.set(`${changePasswordPrefix}${key}`, userId, 'ex', 60 * 20);
  await redis.set(`${changePasswordPrefix}${email}`, true, 'ex', 60 * 20);

  return key;
};

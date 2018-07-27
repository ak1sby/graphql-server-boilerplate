import dropAllUserSessions from './dropAllUserSessions';
import User from '../entity/User';

export default async (user, redis) => {
  await dropAllUserSessions(user.id, redis);
  await User.update({ id: user.id }, { locked: true });

  return null;
};

import bcrypt from 'bcryptjs';

import dropAllUserSessions from '../../../utils/dropAllUserSessions';
import User from '../../../entity/User';
import { changePasswordPrefix } from '../../../constants';
import formatYupError from '../../../utils/formatYupError';
import sendEmail from '../../../utils/sendEmail';
import { isProduction } from '../../../../config';
import errorMess from '../../../errorMess';
import schema from '../../../yupSchemas';
import createKey from '../../../utils/createKey';

export const resolvers = {
  Mutation: {
    getKey: async (_, { email }, { redis }) => {
      const user = await User.findOne({ where: { email } });
      const AlreadySend = await redis.get(`${changePasswordPrefix}${email}`);
      if (!user) {
        return [
          {
            path: 'email',
            message: errorMess.userNotFoundError
          }
        ];
      }

      if (AlreadySend) {
        return [
          {
            path: 'email',
            message: errorMess.keyAlreadySend
          }
        ];
      }

      await dropAllUserSessions(user.id, redis);

      const key = await createKey(email, user.id, redis);

      if (isProduction) {
        sendEmail(email, key);
      }
      console.log(key);
      return null;
    },
    changePassword: async (_, { password, key }, { redis }) => {
      const keyWithPrefix = `${changePasswordPrefix}${key}`;
      const userId = await redis.get(keyWithPrefix);

      if (!userId) {
        return [
          {
            path: 'key',
            message: errorMess.expiredKeyError
          }
        ];
      }

      try {
        await schema.validate({ password }, { abortEarly: false });
      } catch (err) {
        return formatYupError(err);
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await User.update(
        { id: userId },
        {
          password: hashedPassword,
          locked: false
        }
      );

      await redis.del(keyWithPrefix);

      return null;
    }
  }
};

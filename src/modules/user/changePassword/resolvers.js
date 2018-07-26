import { v4 } from 'uuid';
import bcrypt from 'bcryptjs';

import dropAllUserSessions from '../../../utils/dropAllUserSessions';
import User from '../../../entity/User';
import { changePasswordPrefix } from '../../../constants';
import formatYupError from '../../../utils/formatYupError';
import sendEmail from '../../../utils/sendEmail';
import { isProduction } from '../../../../config';
import errorMess from '../../../errorMess';
import schema from '../../../yupSchemas';

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

      const id = v4();
      await redis.set(`${changePasswordPrefix}${id}`, user.id, 'ex', 60 * 20);
      await redis.set(`${changePasswordPrefix}${email}`, true, 'ex', 60 * 20);

      if (isProduction) {
        sendEmail(email, id);
      }

      return null;
    },
    changePassword: async (_, { password, id }, { redis }) => {
      const key = `${changePasswordPrefix}${id}`;
      const userId = await redis.get(key);

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
          password: hashedPassword
        }
      );

      await redis.del(key);

      return null;
    }
  }
};

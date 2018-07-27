import bcrypt from 'bcryptjs';

import User from '../../../entity/User';
import errorMess from '../../../errorMess';
import {
  userSessionIdPrefix,
  passwordAttemptsPrefix
} from '../../../constants';
import sendEmail from '../../../utils/sendEmail';
import { isProduction } from '../../../../config';
import lockAcc from '../../../utils/lockAcc';

export const resolvers = {
  Mutation: {
    login: async (_, { email, password }, { session, redis, sessionID }) => {
      const user = await User.findOne({ where: { email } });
      const passwordAttempts = await redis.get(
        `${passwordAttemptsPrefix}${email}`
      );

      if (!user) {
        return [
          {
            path: 'email',
            message: errorMess.invalidLogin
          }
        ];
      }

      if (!user.confirmed) {
        return [
          {
            path: 'email',
            message: errorMess.confirmEmailError
          }
        ];
      }

      if (user.locked) {
        return [
          {
            path: 'email',
            message: errorMess.accLocked
          }
        ];
      }

      const valid = await bcrypt.compare(password, user.password);

      if (!valid) {
        if (!passwordAttempts) {
          await redis.set(`${passwordAttemptsPrefix}${email}`, 0, 'ex', 60 * 5);
        } else if (passwordAttempts > 50) {
          await lockAcc(user, redis);
          if (isProduction) {
            await sendEmail(
              email,
              'Someone trying to sign in to your account, your acc locked, please change password'
            );
          }
          console.log('Someone trying to sign in to your account');
        }
        await redis.incr(`${passwordAttemptsPrefix}${email}`);

        return [
          {
            path: 'password',
            message: errorMess.invalidPassword
          }
        ];
      }

      session.userId = user.id; // eslint-disable-line no-param-reassign

      await redis.lpush(`${userSessionIdPrefix}${user.id}`, sessionID);

      return null;
    }
  }
};

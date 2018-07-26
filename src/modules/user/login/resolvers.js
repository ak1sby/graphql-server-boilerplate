import bcrypt from 'bcryptjs';

import User from '../../../entity/User';
import errorMess from '../../../errorMess';
import { userSessionIdPrefix } from '../../../constants';

export const resolvers = {
  Mutation: {
    login: async (_, { email, password }, { session, redis, sessionID }) => {
      const user = await User.findOne({ where: { email } });

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

      const valid = await bcrypt.compare(password, user.password);

      if (!valid) {
        return [
          {
            path: 'email',
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

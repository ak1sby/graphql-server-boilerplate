import { v4 } from 'uuid';

import User from '../../../entity/User';
import formatYupError from '../../../utils/formatYupError';
import { isProduction } from '../../../../config';
import { confirmedEmailPrefix } from '../../../constants';
import sendEmail from '../../../utils/sendEmail';
import schema from '../../../yupSchemas';
import errorMess from '../../../errorMess';

export const resolvers = {
  Mutation: {
    register: async (_, args, { redis }) => {
      try {
        await schema.validate(args, { abortEarly: false });
      } catch (err) {
        return formatYupError(err);
      }

      const { email, password } = args;

      const userAlreadyExists = await User.findOne({
        where: { email },
        select: ['id']
      });

      if (userAlreadyExists) {
        return [
          {
            path: 'email',
            message: errorMess.duplicateEmail
          }
        ];
      }

      const user = User.create({ email, password });
      await user.save();

      const id = v4();
      const key = `${confirmedEmailPrefix}${id}`;

      await redis.set(key, user.id, 'ex', 60 * 60 * 24);

      if (isProduction) {
        sendEmail(email, id);
      }

      console.log(id);

      return null;
    },

    confirmEmail: async (_, { id }, { redis }) => {
      const key = `${confirmedEmailPrefix}${id}`;
      const userId = await redis.get(key);

      if (!userId) {
        return [
          {
            path: 'key',
            message: errorMess.expiredKeyError
          }
        ];
      }
      await User.update({ id: userId }, { confirmed: true });
      await redis.del(key);

      return null;
    }
  }
};

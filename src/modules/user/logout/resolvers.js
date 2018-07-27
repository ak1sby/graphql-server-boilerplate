import dropAllUserSessions from '../../../utils/dropAllUserSessions';
import errorMess from '../../../errorMess';

export const resolvers = {
  Mutation: {
    logout: async (_, __, { session, redis }) => {
      const { userId } = session;
      if (!userId) {
        return [
          {
            path: 'user',
            message: errorMess.UserAlreadyLogout
          }
        ];
      }
      return dropAllUserSessions(userId, redis);
    }
  }
};

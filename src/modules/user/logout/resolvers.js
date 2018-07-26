import dropAllUserSessions from '../../../utils/dropAllUserSessions';

export const resolvers = {
  Mutation: {
    logout: async (_, __, { session, redis }) => {
      const { userId } = session;
      if (userId) {
        return dropAllUserSessions(userId, redis);
      }
      return false;
    }
  }
};

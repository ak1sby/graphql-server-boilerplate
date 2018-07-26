import faker from 'faker';
import { v4 } from 'uuid';
import redis from '../src/redis';

import User from '../src/entity/User';
import TestClient from './utils/testClient';
import startServer from '../src/startServer';
import errorMess from '../src/errorMess';
import { changePasswordPrefix } from '../src/constants';

beforeAll(async () => {
  await redis.flushall();
  const app = await startServer();
  const { port } = app.address();
  process.env.TEST_HOST = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  await redis.flushall();
});

describe('user', () => {
  test('register: check duplicate emails', async () => {
    const client = new TestClient(process.env.TEST_HOST);

    const email = faker.internet.email();
    const password = faker.internet.password();

    const response = await client.register(email, password);
    expect(response.data).toEqual({ register: null });

    const users = await User.find({ where: { email } });

    expect(users).toHaveLength(1);
    const user = users[0];

    expect(user.email).toEqual(email);
    expect(user.password).not.toEqual(password);

    const response2 = await client.register(email, password);
    expect(response2.data.register).toHaveLength(1);
    expect(response2.data.register[0]).toEqual({
      path: 'email',
      message: errorMess.duplicateEmail
    });
  });

  test('register: check bad password/email', async () => {
    const client = new TestClient(process.env.TEST_HOST);

    const badMail = 'm';
    const badPassword = 'p';

    const response = await client.register(badMail, badPassword);
    expect(response.data).toEqual({
      register: [
        {
          path: 'email',
          message: errorMess.emailNotLongEnough
        },
        {
          path: 'email',
          message: errorMess.invalidEmail
        },
        {
          path: 'password',
          message: errorMess.passwordNotLongEnough
        }
      ]
    });
  });

  test('login: email confirmed/not confirmed', async () => {
    const client = new TestClient(process.env.TEST_HOST);

    const email = faker.internet.email();
    const password = faker.internet.password();

    await User.create({
      email,
      password,
      confirmed: false
    }).save();

    const response1 = await client.login(email, password);

    expect(response1.data).toEqual({
      login: [
        {
          path: 'email',
          message: errorMess.confirmEmailError
        }
      ]
    });

    await User.update({ email }, { confirmed: true });

    const response2 = await client.login(email, password);

    expect(response2.data).toEqual({ login: null });
  });

  test('login: email invalid/correct', async () => {
    const client = new TestClient(process.env.TEST_HOST);

    const email = faker.internet.email();
    const badEmail = `b${email}`;
    const password = faker.internet.password();

    await User.create({
      email,
      password,
      confirmed: true
    }).save();

    const response = await client.login(badEmail, password);

    expect(response.data).toEqual({
      login: [
        {
          path: 'email',
          message: errorMess.invalidLogin
        }
      ]
    });

    const response2 = await client.login(email, password);

    expect(response2.data).toEqual({ login: null });
  });

  test('self: no cookie', async () => {
    const client = new TestClient(process.env.TEST_HOST);

    const response = await client.self();
    expect(response.data.self).toBeNull();
  });

  test('self: get current user', async () => {
    const client = new TestClient(process.env.TEST_HOST);

    const email = faker.internet.email();
    const password = faker.internet.password();

    const user = await User.create({
      email,
      password,
      confirmed: true
    }).save();

    await client.login(email, password);
    const response = await client.self();

    expect(response.data.self).toEqual({ id: user.id, email });
  });

  test('logout: single session', async () => {
    const client = new TestClient(process.env.TEST_HOST);

    const email = faker.internet.email();
    const password = faker.internet.password();

    const user = await User.create({
      email,
      password,
      confirmed: true
    }).save();

    await client.login(email, password);

    const response = await client.self();

    expect(response.data).toEqual({
      self: {
        id: user.id,
        email
      }
    });

    await client.logout();

    const response2 = await client.self();

    expect(response2.data.self).toBeNull();
  });

  test('logout: multiple sessions', async () => {
    const session1 = new TestClient(process.env.TEST_HOST);
    const session2 = new TestClient(process.env.TEST_HOST);

    const email = faker.internet.email();
    const password = faker.internet.password();

    const user = await User.create({
      email,
      password,
      confirmed: true
    }).save();

    await session1.login(email, password);
    await session2.login(email, password);

    const res1Client1 = await session1.self();
    const res1Client2 = await session2.self();

    expect(res1Client1.data).toEqual({
      self: {
        id: user.id,
        email
      }
    });

    expect(res1Client1.data).toEqual(res1Client2.data);

    await session1.logout();

    const res2Client2 = await session2.self();

    expect(res2Client2.data.self).toBeNull();
  });

  test('getKey: email correct/invalid', async () => {
    const client = new TestClient(process.env.TEST_HOST);

    const email = faker.internet.email();
    const badEmail = `b${email}`;
    const password = faker.internet.password();

    await User.create({
      email,
      password,
      confirmed: true
    }).save();

    const response = await client.getKey(email);

    expect(response.data).toEqual({ getKey: null });

    const response2 = await client.getKey(badEmail);

    expect(response2.data).toEqual({
      getKey: [
        {
          path: 'email',
          message: errorMess.userNotFoundError
        }
      ]
    });
  });

  test('changePassword: old pass !== new pass', async () => {
    const client = new TestClient(process.env.TEST_HOST);

    const email = faker.internet.email();
    const password = faker.internet.password();
    const newPassword = 'newPass';

    const user = await User.create({
      email,
      password,
      confirmed: true
    }).save();

    const id = v4();
    const key = `${changePasswordPrefix}${id}`;

    await redis.set(key, user.id, 'ex', 1);

    const response = await client.changePassword(newPassword, id);

    expect(response.data).toEqual({ changePassword: null });

    const users = await User.find({ where: { email } });

    const updatedUser = users[0];

    expect(user.password).not.toEqual(updatedUser.password);
  });
});

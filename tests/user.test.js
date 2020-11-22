const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user');
const {userOneId, userOne, setupDatabase} = require('./fixtures/db');

beforeEach(setupDatabase);

test('Should Signup a new user', async () => {
  const response = await request(app).post('/users').send({
    name: 'Andrew',
    email: 'andrewdrew@example.com',
    password: 'mypass777'
  }).expect(201);

  //check databases was change correctly
  const user = await User.findById(response.body.user._id);
  expect(user).not.toBeNull();
  //
  expect(response.body).toMatchObject({
    user: {
      name: 'Andrew',
      email: 'andrewdrew@example.com',
    },
    token: user.tokens[0].token
  })
  expect(user.password).not.toBe('mypass777')
});

test('Should login existing user', async () => {
  const response = await request(app).post('/users/login').send({
    email: userOne.email,
    password: userOne.password
  }).expect(200);
  const user = await User.findById(userOneId);
  expect(response.body.token).toBe(user.tokens[1].token);
});

test('Should login nonexisting user', async () => {
  await request(app).post('/users/login').send({
    email: userOne.email,
    password: 'randompass'
  }).expect(400);
});

test('Should get profile for user', async () => {
  await request(app)
    .get('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
});

test('Should not get profile for user for unauthenticate', async () => {
  await request(app)
    .get('/users/me')
    .send()
    .expect(401);
});

test('Should not delete profile for user for unauthenticate', async () => {
  await request(app)
    .delete('/user/me')
    .send()
    .expect(401);
});

test('Should delete profile for user', async () => {
  await request(app)
    .delete('/user/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
  const user = await User.findById(userOneId);
  expect(user).toBeNull();
});

test('Should upload avatar image', async () => {
  await request(app)
    .post('/user/me/avatar')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .attach('avatar', 'tests/fixtures/profile-pic.jpg')
    .expect(200);
  const user = await User.findById(userOneId);
  expect(user.avatar).toEqual(expect.any(Buffer));
});

test('Should update valid user field', async () => {
  await request(app)
    .patch('/user/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      'name': 'Jess'
    })
    .expect(200);
  const user = await User.findById(userOneId);
  expect(user.name).toEqual('Jess');
});

test('Should not update invalid user field', async () => {
  await request(app)
    .patch('/user/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      'location': 'Califonia'
    })
    .expect(400);
});

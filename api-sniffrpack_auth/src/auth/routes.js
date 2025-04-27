import { register, login, getProfile, logout } from './controllers/authController.js';

export default async function authRoutes(fastify, opts) {
  fastify.post('/register', register);
  fastify.post('/login', login);
  fastify.get('/me', { preHandler: [fastify.authenticate] }, getProfile);
  fastify.post('/logout', { preHandler: [fastify.authenticate] }, logout);
};

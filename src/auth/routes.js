// src/auth/routes.js

import { register, login, me, logout } from './controllers/authController.js';

export default async function authRoutes(fastify, opts) {
  // 1) Register a new user (tenant-admin or client)
  fastify.post(
    '/register',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email','password','name'],
          properties: {
            email:    { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
            name:     { type: 'string' },
            role:     { type: 'string', enum: ['tenant_admin','client'], default: 'client' }
          }
        },
        response: {
          201: {
            type: 'object',
            properties: {
              user:  { $ref: 'auth#/definitions/User' },
              token: { type: 'string' }
            }
          }
        }
      }
    },
    register
  );

  // 2) Login existing user
  fastify.post(
    '/login',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email','password'],
          properties: {
            email:    { type: 'string', format: 'email' },
            password: { type: 'string' }
          }
        }
      }
    },
    login
  );

  // 3) Get current user profile
  fastify.get(
    '/me',
    {
      preHandler: [ fastify.authenticate ],
      schema: {
        response: {
          200: { type: 'object', properties: { user: { $ref: 'auth#/definitions/User' } } }
        }
      }
    },
    me
  );

  // 4) Logout
  fastify.post(
    '/logout',
    {
      preHandler: [ fastify.authenticate ]
    },
    logout
  );
}

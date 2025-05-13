// src/auth/routes.js

import { register, login, me, logout } from './controllers/authController.js';

const UserResponse = {
  type: 'object',
  properties: {
    id:           { type: 'string', format: 'uuid' },
    email:        { type: 'string', format: 'email' },
    name:         { type: 'string' },
    role:         { type: 'string', enum: ['tenant_admin','client'] },
    created_at:   { type: 'string', format: 'date-time' }
  }
};

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
              user:  UserResponse,
              token: { type: 'string' }
            }
          }
        }
      }
    },
    register
  );

  // 2) Login existing user — now returns both user + token
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
        },
        response: {
          200: {
            type: 'object',
            properties: {
              user:  UserResponse,
              token: { type: 'string' }
            }
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
          200: {
            type: 'object',
            properties: {
              user: UserResponse
            }
          }
        }
      }
    },
    me
  );

  // 4) Logout
  fastify.post(
    '/logout',
    {
      preHandler: [ fastify.authenticate ],
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' }
            }
          }
        }
      }
    },
    logout
  );
}

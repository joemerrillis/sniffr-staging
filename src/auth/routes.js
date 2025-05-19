// src/auth/routes.js

import { register, login, me, logout } from './controllers/authController.js';

const UserResponse = {
  type: 'object',
  properties: {
    id:           { type: 'string', format: 'uuid' },
    email:        { type: 'string', format: 'email' },
    name:         { type: 'string' },
    role:         { type: 'string', enum: ['tenant_admin', 'client'] },
    created_at:   { type: 'string', format: 'date-time' }
  }
};

export default async function authRoutes(fastify, opts) {
  // 1) REGISTER a new user (tenant-admin or client)
  fastify.post(
    '/register',
    {
      schema: {
        description: 'Register a new user as tenant-admin or client.',
        tags: ['Auth'],
        body: {
          type: 'object',
          required: ['email', 'password', 'name'],
          properties: {
            email:    { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
            name:     { type: 'string' },
            role:     { type: 'string', enum: ['tenant_admin', 'client'], default: 'client' }
          }
        },
        response: {
          201: {
            type: 'object',
            properties: {
              user:  UserResponse,
              token: { type: 'string' }
            },
            required: ['user', 'token']
          }
        }
      }
    },
    register
  );

  // 2) LOGIN existing user — returns user + token
  fastify.post(
    '/login',
    {
      schema: {
        description: 'Login as an existing user. Returns user profile and JWT token.',
        tags: ['Auth'],
        body: {
          type: 'object',
          required: ['email', 'password'],
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
            },
            required: ['user', 'token']
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
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Get the profile of the currently authenticated user.',
        tags: ['Auth'],
        response: {
          200: {
            type: 'object',
            properties: {
              user: UserResponse
            },
            required: ['user']
          }
        }
      }
    },
    me
  );

  // 4) Logout current user
  fastify.post(
    '/logout',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Logout the currently authenticated user.',
        tags: ['Auth'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' }
            },
            required: ['success']
          }
        }
      }
    },
    logout
  );
}

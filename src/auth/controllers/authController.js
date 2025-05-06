// src/auth/controllers/authController.js

import { findUserByEmail, createUser } from '../services/authService.js';
import { hashPassword } from '../utils/password.js';

export async function register(request, reply) {
  const { email, name, password, role = 'client' } = request.body;

  // 1) Prevent duplicate email
  const existing = await findUserByEmail(request.server, email).catch(() => null);
  if (existing) {
    return reply.code(400).send({ error: 'User already exists' });
  }

  // 2) Hash password
  const passwordHash = await hashPassword(password);

  // 3) Create user with provided or default role
  const user = await createUser(request.server, {
    email,
    name,
    role,
    passwordHash
  });

  // 4) Sign JWT including the user ID and role
  const token = request.server.jwt.sign({
    userId: user.id,
    role:   user.role,
    email:  user.email,
    name:   user.name
  });

  // 5) Return the user and token
  reply.code(201).send({ user, token });
}

export async function login(request, reply) {
  const { email, password } = request.body;
  // existing login logic unchanged...
}

export async function me(request, reply) {
  // existing profile logic unchanged...
}

export async function logout(request, reply) {
  // existing logout logic unchanged...
}

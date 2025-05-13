// src/auth/controllers/authController.js

import { findUserByEmail, createUser } from '../services/authService.js';
import { hashPassword, comparePassword } from '../utils/password.js';

export async function register(request, reply) {
  const { email, name, password, role = 'client' } = request.body;

  // 1) Prevent duplicate email
  const existing = await findUserByEmail(request.server, email).catch(() => null);
  if (existing) {
    return reply.code(400).send({ error: 'User already exists' });
  }

  // 2) Hash password
  const passwordHash = await hashPassword(password);

  // 3) Create user
  const user = await createUser(request.server, {
    email,
    name,
    role,
    passwordHash
  });

  // 4) Sign JWT with both `id` (payload) and `sub`
  const token = request.server.jwt.sign(
    { id: user.id, role: user.role, email: user.email, name: user.name },
    { subject: String(user.id), expiresIn: '8h' }
  );

  // 5) Return the new user and token
  reply.code(201).send({ user, token });
}

export async function login(request, reply) {
  const { email, password } = request.body;

  // 1) Find user by email
  const user = await findUserByEmail(request.server, email);
  if (!user) {
    return reply.code(401).send({ error: 'Invalid credentials' });
  }

  // 2) Compare against the actual hash column
  const isValid = await comparePassword(password, user.password_hash);
  if (!isValid) {
    return reply.code(401).send({ error: 'Invalid credentials' });
  }

  // 3) Sign JWT (same as register)
  const token = request.server.jwt.sign(
    { id: user.id, role: user.role, email: user.email, name: user.name },
    { subject: String(user.id), expiresIn: '8h' }
  );

  // 4) Return the user and token
  reply.send({ user, token });
}

export async function me(request, reply) {
  // If you want to return the logged-in user’s info:
  reply.send({ user: request.user });
}

export async function logout(request, reply) {
  // Perform any logout cleanup here (if needed)
  reply.send({ success: true });
}

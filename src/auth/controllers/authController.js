// src/auth/controllers/authController.js

import { findUserByEmail, createUser } from '../services/authService.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

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

  // 4) Sign JWT **with `id`** and **subject** = user.id
  const token = request.server.jwt.sign(
    { id: user.id, role: user.role, email: user.email, name: user.name },
    { subject: String(user.id), expiresIn: '8h' }
  );

  // 5) Return
  reply.code(201).send({ user, token });
}

export async function login(request, reply) {
  const { email, password } = request.body;
  const user = await findUserByEmail(request.server, email);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return reply.code(401).send({ error: 'Invalid credentials' });
  }

  // Same signing logic as register:
  const token = request.server.jwt.sign(
    { id: user.id, role: user.role, email: user.email, name: user.name },
    { subject: String(user.id), expiresIn: '8h' }
  );

  reply.send({ user, token });
}

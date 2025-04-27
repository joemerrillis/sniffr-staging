import { hashPassword, comparePassword } from '../utils/password.js';
import { findUserByEmail, createUser } from '../services/authService.js';

export async function register(request, reply) {
  const { email, name, password } = request.body;
  const existing = await findUserByEmail(request.server, email).catch(() => null);
  if (existing) {
    return reply.code(400).send({ error: 'User already exists' });
  }
  const passwordHash = await hashPassword(password);
  const user = await createUser(request.server, { email, name, role: 'client', passwordHash });
  reply.code(201).send({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
}

export async function login(request, reply) {
  const { email, password } = request.body;
  const user = await findUserByEmail(request.server, email).catch(() => null);
  if (!user) return reply.code(400).send({ error: 'Invalid credentials' });
  const valid = await comparePassword(password, user.password_hash);
  if (!valid) return reply.code(400).send({ error: 'Invalid credentials' });

  // sign JWT
  const token = await request.jwtSign({ userId: user.id, role: user.role, tenantId: user.tenant_id });
  reply.send({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
}

export async function getProfile(request, reply) {
  const { userId } = request.user;
  const { data, error } = await request.server.supabase
    .from('users')
    .select('id, email, name, role, tenant_id')
    .eq('id', userId)
    .single();
  if (error) return reply.code(404).send({ error: 'User not found' });
  reply.send({ user: data });
}

export async function logout(request, reply) {
  // With JWTs, clients can simply discard token;
  // implement blacklist here if needed.
  reply.send({ message: 'Logged out' });
}

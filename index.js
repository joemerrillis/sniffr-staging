// index.js
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const fastify = Fastify({ logger: true });
fastify.register(cors, { origin: true });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Auth preHandler (skip for auth routes)
fastify.addHook('preHandler', async function (req, reply) {
  if (req.routerPath && req.routerPath.startsWith('/auth')) return;

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    reply.status(401).send({ error: 'Unauthorized' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    reply.status(401).send({ error: 'Invalid token' });
    return;
  }

  req.user = user;
});

// --- Auth Routes ---
fastify.post('/auth/signup', async (req, reply) => {
  const { email, password, name, role = 'client', tenantSlug } = req.body;
  const { data: tenant, error: tErr } = await supabase
    .from('tenants').select('id').eq('slug', tenantSlug).single();
  if (tErr || !tenant) return reply.status(400).send({ error: 'Invalid tenant' });

  const { data: authData, error: aErr } = await supabase.auth.signUp({ email, password });
  if (aErr) return reply.status(400).send({ error: aErr.message });

  const { data: profile, error: pErr } = await supabase
    .from('users')
    .insert({ id: authData.user.id, tenant_id: tenant.id, email, name, role })
    .single();
  if (pErr) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    return reply.status(500).send({ error: pErr.message });
  }

  reply.code(201).send(profile);
});

fastify.post('/auth/login', async (req, reply) => {
  const { email, password } = req.body;
  const { data: session, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return reply.status(401).send({ error: error.message });
  reply.send(session);
});

fastify.post('/auth/logout', async (req, reply) => {
  await supabase.auth.signOut();
  reply.send({});
});

fastify.get('/auth/me', async (req, reply) => {
  reply.send(req.user);
});

// --- Tenant Routes ---
fastify.post('/tenants', async (req, reply) => {
  const { data, error } = await supabase.from('tenants').insert(req.body).single();
  if (error) return reply.status(400).send({ error });
  reply.send(data);
});
fastify.get('/tenants/:id', async (req, reply) => {
  const { data, error } = await supabase.from('tenants').select('*').eq('id', req.params.id).single();
  if (error) return reply.status(404).send({ error });
  reply.send(data);
});
fastify.patch('/tenants/:id', async (req, reply) => {
  const { data, error } = await supabase.from('tenants').update(req.body).eq('id', req.params.id).single();
  if (error) return reply.status(400).send({ error });
  reply.send(data);
});

// --- User Routes ---
fastify.get('/tenants/:id/users', async (req, reply) => {
  const { data, error } = await supabase.from('users').select('*').eq('tenant_id', req.params.id);
  if (error) return reply.status(400).send({ error }); reply.send(data);
});
fastify.post('/tenants/:id/users', async (req, reply) => {
  const payload = { ...req.body, tenant_id: req.params.id };
  const { data, error } = await supabase.from('users').insert(payload).single();
  if (error) return reply.status(400).send({ error }); reply.send(data);
});
fastify.get('/users/:id', async (req, reply) => {
  const { data, error } = await supabase.from('users').select('*').eq('id', req.params.id).single();
  if (error) return reply.status(404).send({ error }); reply.send(data);
});
fastify.patch('/users/:id', async (req, reply) => {
  const { data, error } = await supabase.from('users').update(req.body).eq('id', req.params.id).single();
  if (error) return reply.status(400).send({ error }); reply.send(data);
});
fastify.delete('/users/:id', async (req, reply) => {
  const { error } = await supabase.from('users').delete().eq('id', req.params.id);
  if (error) return reply.status(400).send({ error }); reply.send({});
});

// --- Dog & Friends Routes ---
fastify.get('/tenants/:id/dogs', async (req, reply) => {
  const { data, error } = await supabase.from('dogs').select('*').eq('tenant_id', req.params.id);
  if (error) return reply.status(400).send({ error }); reply.send(data);
});
fastify.post('/tenants/:id/dogs', async (req, reply) => {
  const payload = { ...req.body, tenant_id: req.params.id };
  const { data, error } = await supabase.from('dogs').insert(payload).single();
  if (error) return reply.status(400).send({ error }); reply.send(data);
});
fastify.get('/dogs/:id', async (req, reply) => {
  const { data, error } = await supabase.from('dogs').select('*').eq('id', req.params.id).single();
  if (error) return reply.status(404).send({ error }); reply.send(data);
});
fastify.patch('/dogs/:id', async (req, reply) => {
  const { data, error } = await supabase.from('dogs').update(req.body).eq('id', req.params.id).single();
  if (error) return reply.status(400).send({ error }); reply.send(data);
});
fastify.delete('/dogs/:id', async (req, reply) => {
  const { error } = await supabase.from('dogs').delete().eq('id', req.params.id);
  if (error) return reply.status(400).send({ error }); reply.send({});
});
fastify.get('/dogs/:id/friends', async (req, reply) => {
  const { data, error } = await supabase.from('dog_friends').select('*').eq('dog_id', req.params.id);
  if (error) return reply.status(400).send({ error }); reply.send(data);
});
fastify.post('/dogs/:id/friends/:friendId', async (req, reply) => {
  const payload = { dog_id: req.params.id, friend_dog_id: req.params.friendId };
  const { data, error } = await supabase.from('dog_friends').insert(payload).single();
  if (error) return reply.status(400).send({ error }); reply.send(data);
});
fastify.patch('/dogs/:id/friends/:friendId', async (req, reply) => {
  const { status } = req.body;
  const { data, error } = await supabase.from('dog_friends').update({ status }).match({ dog_id: req.params.id, friend_dog_id: req.params.friendId }).single();
  if (error) return reply.status(400).send({ error }); reply.send(data);
});
fastify.delete('/dogs/:id/friends/:friendId', async (req, reply) => {
  const { error } = await supabase.from('dog_friends').delete().match({ dog_id: req.params.id, friend_dog_id: req.params.friendId });
  if (error) return reply.status(400).send({ error }); reply.send({});
});

// --- Pricing Tier Routes ---
fastify.get('/tenants/:id/walk-pricing-tiers', async (req, reply) => {
  const { data, error } = await supabase.from('walk_pricing_tiers').select('*').eq('tenant_id', req.params.id);
  if (error) return reply.status(400).send({ error }); reply.send(data);
});
fastify.post('/tenants/:id/walk-pricing-tiers', async (req, reply) => {
  const payload = { ...req.body, tenant_id: req.params.id };
  const { data, error } = await supabase.from('walk_pricing_tiers').insert(payload).single();
  if (error) return reply.status(400).send({ error }); reply.send(data);
});
fastify.get('/tenants/:id/boarding-pricing-tiers', async (req, reply) => {
  const { data, error } = await supabase.from('boarding_pricing_tiers').select('*').eq('tenant_id', req.params.id);
  if (error) return reply.status(400).send({ error }); reply.send(data);
});
fastify.post('/tenants/:id/boarding-pricing-tiers', async (req, reply) => {
  const payload = { ...req.body, tenant_id: req.params.id };
  const { data, error } = await supabase.from('boarding_pricing_tiers').insert(payload).single();
  if (error) return reply.status(400).send({ error }); reply.send(data);
});

// --- Daycare Routes ---
fastify.get('/tenants/:id/daycare-packages', async (req, reply) => {
  const { data, error } = await supabase.from('daycare_packages').select('*').eq('tenant_id', req.params.id);
  if (error) return reply.status(400).send({ error }); reply.send(data);
});
fastify.post('/tenants/:id/daycare-packages', async (req, reply) => {
  const payload = { ...req.body, tenant_id: req.params.id };
  const { data, error } = await supabase.from('daycare_packages').insert(payload).single();
  if (error) return reply.status(400).send({ error }); reply.send(data);
});
fastify.get('/tenants/:id/daycare-settings', async (req, reply) => {
  const { data, error } = await supabase.from('daycare_settings').select('*').eq('tenant_id', req.params.id).single();
  if (error) return reply.status(404).send({ error }); reply.send(data);
});
fastify.post('/tenants/:id/daycare-settings', async (req, reply) => {
  const payload = { ...req.body, tenant_id: req.params.id };
  const { data, error } = await supabase.from('daycare_settings').upsert(payload).single();
  if (error) return reply.status(400).send({ error }); reply.send(data);
});
fastify.post('/daycare/sessions', async (req, reply) => {
  const { data, error } = await supabase.from('daycare_sessions').insert(req.body).single();
  if (error) return reply.status(400).send({ error }); reply.send(data);
});

// Start server
fastify.listen({ port: process.env.PORT || 3000 });

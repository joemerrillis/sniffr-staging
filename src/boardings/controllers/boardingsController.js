// src/boardings/controllers/boardingsController.js

import {
  listBoardings,
  getBoarding,
  createBoarding,
  updateBoarding,
  deleteBoarding
} from '../services/boardingsService.js';

export async function list(req, reply) {
  const { tenant_id } = req.query;
  const data = await listBoardings(req.server, tenant_id);
  reply.send({ boardings: data });
}

export async function retrieve(req, reply) {
  const { id } = req.params;
  const data = await getBoarding(req.server, id);
  if (!data) return reply.code(404).send({ error: 'Not found' });
  reply.send({ boarding: data });
}

export async function create(req, reply) {
  const data = await createBoarding(req.server, req.body);
  reply.code(201).send({ boarding: data });
}

export async function modify(req, reply) {
  const { id } = req.params;
  const data = await updateBoarding(req.server, id, req.body);
  reply.send({ boarding: data });
}

export async function remove(req, reply) {
  const { id } = req.params;
  await deleteBoarding(req.server, id);
  reply.code(204).send();
}

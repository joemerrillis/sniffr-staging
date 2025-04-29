// src/domains/controllers/domainsController.js

import {
  listDomains,
  getDomainById,
  createDomain,
  updateDomain,
  deleteDomain,
  verifyDomain
} from '../services/domainsService.js';

export async function list(request, reply) {
  const tenantId = request.query.tenant_id;
  const domains = await listDomains(request.server, tenantId);
  reply.send({ domains });
}

export async function retrieve(request, reply) {
  const id = request.params.id;
  let domain;
  try {
    domain = await getDomainById(request.server, id);
  } catch (err) {
    return reply.code(404).send({ message: `Domain ${id} not found.` });
  }
  reply.send({ domain });
}

export async function create(request, reply) {
  const payload = request.body;
  const domain = await createDomain(request.server, payload);
  reply.code(201).send({ domain });
}

export async function modify(request, reply) {
  const id = request.params.id;
  const payload = request.body;
  let domain;
  try {
    domain = await updateDomain(request.server, id, payload);
  } catch (err) {
    return reply.code(404).send({ message: `Domain ${id} not found.` });
  }
  reply.send({ domain });
}

export async function remove(request, reply) {
  const id = request.params.id;
  try {
    await deleteDomain(request.server, id);
  } catch (err) {
    return reply.code(404).send({ message: `Domain ${id} not found.` });
  }
  reply.code(204).send();
}

export async function verify(request, reply) {
  const id = request.params.id;
  let domain;
  try {
    domain = await verifyDomain(request.server, id);
  } catch (err) {
    return reply.code(404).send({ message: `Domain ${id} not found or cannot verify.` });
  }
  reply.send({ domain });
}

import { listDomains, getDomainById, createDomain, updateDomain, deleteDomain, verifyDomain } from '../services/domainsService.js';

export async function list(request, reply) {
  const tenantId = request.query.tenant_id;
  const domains = await listDomains(request.server, tenantId);
  reply.send({ domains });
}

export async function retrieve(request, reply) {
  const domain = await getDomainById(request.server, request.params.id);
  reply.send({ domain });
}

export async function create(request, reply) {
  const domain = await createDomain(request.server, request.body);
  reply.code(201).send({ domain });
}

export async function modify(request, reply) {
  const domain = await updateDomain(request.server, request.params.id, request.body);
  reply.send({ domain });
}

export async function remove(request, reply) {
  await deleteDomain(request.server, request.params.id);
  reply.code(204).send();
}

export async function verify(request, reply) {
  const domain = await verifyDomain(request.server, request.params.id);
  reply.send({ domain });
}
// src/pendingServices/controllers/pendingServicesController.js
import { listPendingServices, seedFromWindows, confirmPendingService, deletePendingService } from '../services/pendingServicesService.js';

export async function list(req, reply) {
  const userId = req.user.sub;
  const { week_start } = req.query;
  const services = await listPendingServices(req.server, userId, week_start);
  reply.send({ pending_services: services });
}

export async function seed(req, reply) {
  const userId = req.user.sub;
  const { week_start } = req.query;
  await seedFromWindows(req.server, userId, week_start);
  reply.send({ success: true });
}

export async function confirm(req, reply) {
  const userId = req.user.sub;
  const { id } = req.params;
  const service = await confirmPendingService(req.server, userId, id);
  reply.send({ pending_service: service });
}

export async function remove(req, reply) {
  const userId = req.user.sub;
  const { id } = req.params;
  await deletePendingService(req.server, userId, id);
  reply.code(204).send();
}

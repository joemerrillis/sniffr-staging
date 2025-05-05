import {
  listAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment
} from '../services/dogAssignmentsService.js';

export async function list(request, reply) {
  const { dog_id, walker_id, source } = request.query;
  const data = await listAssignments(request.server, { dog_id, walker_id, source });
  return { assignments: data };
}

export async function retrieve(request, reply) {
  const id = request.params.id;
  const data = await getAssignment(request.server, id);
  reply.send(data);
}

export async function create(request, reply) {
  const payload = request.body;
  const data = await createAssignment(request.server, payload);
  reply.code(201).send(data);
}

export async function modify(request, reply) {
  const id = request.params.id;
  const payload = request.body;
  const data = await updateAssignment(request.server, id, payload);
  reply.send(data);
}

export async function remove(request, reply) {
  await deleteAssignment(request.server, request.params.id);
  reply.code(204).send();
}

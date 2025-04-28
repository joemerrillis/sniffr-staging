import { listUsers, getUserById, updateUser, deleteUser } from '../services/usersService.js';

export async function list(request, reply) {
  const users = await listUsers(request.server);
  reply.send({ users });
}

export async function retrieve(request, reply) {
  const user = await getUserById(request.server, request.params.id);
  reply.send({ user });
}

export async function modify(request, reply) {
  const user = await updateUser(request.server, request.params.id, request.body);
  reply.send({ user });
}

export async function remove(request, reply) {
  await deleteUser(request.server, request.params.id);
  reply.code(204).send();
}
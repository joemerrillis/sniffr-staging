import {
  listFriendships,
  getFriendship,
  createFriendship,
  updateFriendship,
  deleteFriendship
} from '../services/dogFriendsService.js';

export async function list(request, reply) {
  const dogId = request.query.dog_id;
  const friends = await listFriendships(request.server, dogId);
  return { friendships: friends };
}

export async function retrieve(request, reply) {
  const id = request.params.id;
  const friend = await getFriendship(request.server, id);
  reply.send({ friendship: friend });
}

export async function create(request, reply) {
  const payload = request.body;
  const friend = await createFriendship(request.server, payload);
  reply.code(201).send({ friendship: friend });
}

export async function modify(request, reply) {
  const id = request.params.id;
  const payload = request.body;
  const friend = await updateFriendship(request.server, id, payload);
  reply.send({ friendship: friend });
}

export async function remove(request, reply) {
  await deleteFriendship(request.server, request.params.id);
  reply.code(204).send();
}

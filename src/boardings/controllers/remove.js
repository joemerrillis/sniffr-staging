import { deleteBoarding } from '../services/index.js';

export default async function remove(request, reply) {
  const { id } = request.params;
  await deleteBoarding(request.server, id);
  reply.code(204).send();
}

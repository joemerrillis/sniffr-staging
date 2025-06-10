import { getBoarding } from '../services/boardingsService.js';

export default async function retrieve(request, reply) {
  const { id } = request.params;
  const data = await getBoarding(request.server, id);
  if (!data) return reply.code(404).send({ error: 'Not found' });
  reply.send({ boarding: data });
}

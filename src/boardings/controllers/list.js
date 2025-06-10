import { listBoardings } from '../services/boardingsService.js';

export default async function list(request, reply) {
  const { tenant_id, user_id, booking_id } = request.query;
  const data = await listBoardings(request.server, { tenant_id, user_id, booking_id });
  reply.send({ boardings: data });
}

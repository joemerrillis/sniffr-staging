import { deleteWalkReport } from '../service/walkReportService.js';

export async function deleteWalkReportController(request, reply) {
  try {
    const id = request.params.id;
    const deleted = await deleteWalkReport(id);
    if (!deleted) return reply.code(404).send({ error: 'Walk report not found.' });
    return reply.send({ deleted: true });
  } catch (error) {
    return reply.code(500).send({ error: error.message });
  }
}

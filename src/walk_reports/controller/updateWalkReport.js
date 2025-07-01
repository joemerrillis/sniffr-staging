import { updateWalkReport } from '../service/walkReportService.js';

export async function updateWalkReportController(request, reply) {
  try {
    const id = request.params.id;
    const updates = request.body;
    const updated = await updateWalkReport(id, updates);
    if (!updated) return reply.code(404).send({ error: 'Walk report not found.' });
    return reply.send(updated);
  } catch (error) {
    return reply.code(500).send({ error: error.message });
  }
}

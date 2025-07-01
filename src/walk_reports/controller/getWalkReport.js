import { getWalkReportById } from '../service/walkReportService.js';

export async function getWalkReportController(request, reply) {
  try {
    const id = request.params.id;
    const report = await getWalkReportById(id);
    if (!report) return reply.code(404).send({ error: 'Walk report not found.' });
    return reply.send(report);
  } catch (error) {
    return reply.code(500).send({ error: error.message });
  }
}

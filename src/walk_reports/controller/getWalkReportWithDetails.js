import { getWalkReportWithDetails } from '../service/walkReportService.js';
import { formatWalkReportForClient } from '../utils/formatWalkReportForClient.js';

export async function getWalkReportWithDetailsController(request, reply) {
  try {
    const id = request.params.id;
    const report = await getWalkReportWithDetails(id);
    if (!report) return reply.code(404).send({ error: 'Walk report not found.' });
    // Format/join events/memories for client consumption
    return reply.send(formatWalkReportForClient(report));
  } catch (error) {
    return reply.code(500).send({ error: error.message });
  }
}

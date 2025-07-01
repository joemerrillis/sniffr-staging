import { listWalkReports } from '../service/walkReportService.js';

export async function listWalkReportsController(request, reply) {
  try {
    const filters = request.query;
    const reports = await listWalkReports(filters);
    return reply.send(reports);
  } catch (error) {
    return reply.code(500).send({ error: error.message });
  }
}

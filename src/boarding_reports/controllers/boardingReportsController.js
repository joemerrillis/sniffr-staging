// controllers/boardingReportsController.js

export async function list(req, reply) {
  try {
    const supabase = req.server.supabase;
    const result = await req.services.listBoardingReports(supabase, req.query);
    // Envelope: always { boarding_reports: [...] }
    reply.send({ boarding_reports: result });
  } catch (err) {
    reply.code(500).send({ error: err.message || 'Failed to fetch boarding reports.' });
  }
}

export async function retrieve(req, reply) {
  try {
    const supabase = req.server.supabase;
    const { id } = req.params;
    if (!id) return reply.code(400).send({ error: "Missing id parameter." });
    const report = await req.services.getBoardingReport(supabase, id);
    if (!report) return reply.code(404).send({ error: "Boarding report not found." });
    reply.send({ boarding_report: report });
  } catch (err) {
    reply.code(500).send({ error: err.message || 'Failed to retrieve boarding report.' });
  }
}

export async function create(req, reply) {
  try {
    const supabase = req.server.supabase;
    // Validation is handled by Fastify schema
    const newReport = await req.services.createBoardingReport(supabase, req.body);
    reply.code(201).send({ boarding_report: newReport });
  } catch (err) {
    reply.code(400).send({ error: err.message || 'Failed to create boarding report.' });
  }
}

export async function modify(req, reply) {
  try {
    const supabase = req.server.supabase;
    const { id } = req.params;
    if (!id) return reply.code(400).send({ error: "Missing id parameter." });
    // Only allow PATCH, partial update
    const updatedReport = await req.services.updateBoardingReport(supabase, id, req.body);
    reply.send({ boarding_report: updatedReport });
  } catch (err) {
    reply.code(400).send({ error: err.message || 'Failed to update boarding report.' });
  }
}

export async function remove(req, reply) {
  try {
    const supabase = req.server.supabase;
    const { id } = req.params;
    if (!id) return reply.code(400).send({ error: "Missing id parameter." });
    await req.services.deleteBoardingReport(supabase, id);
    reply.code(204).send(); // No content on delete
  } catch (err) {
    reply.code(400).send({ error: err.message || 'Failed to delete boarding report.' });
  }
}

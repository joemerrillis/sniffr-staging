// src/boarding_reports/controllers/boardingReportsController.js

import * as services from '../services/boardingReportsService.js';

export async function list(req, reply) {
  try {
    const supabase = req.server.supabase;
    const filters = req.query || {};
    const result = await services.listBoardingReports(supabase, filters);
    reply.send(result); // { boarding_reports: [...] }
  } catch (err) {
    reply.code(500).send({ error: err.message || 'Failed to fetch boarding reports.' });
  }
}

export async function retrieve(req, reply) {
  try {
    const supabase = req.server.supabase;
    const { id } = req.params;
    if (!id) return reply.code(400).send({ error: "Missing id parameter." });
    const result = await services.getBoardingReport(supabase, id);
    if (!result.boarding_report) return reply.code(404).send({ error: "Boarding report not found." });
    reply.send(result); // { boarding_report: { ... } }
  } catch (err) {
    reply.code(500).send({ error: err.message || 'Failed to retrieve boarding report.' });
  }
}

export async function create(req, reply) {
  try {
    const supabase = req.server.supabase;
    const newReport = await services.createBoardingReport(supabase, req.body);
    reply.code(201).send(newReport); // { boarding_report: { ... } }
  } catch (err) {
    reply.code(400).send({ error: err.message || 'Failed to create boarding report.' });
  }
}

export async function modify(req, reply) {
  try {
    const supabase = req.server.supabase;
    const { id } = req.params;
    if (!id) return reply.code(400).send({ error: "Missing id parameter." });
    const updatedReport = await services.updateBoardingReport(supabase, id, req.body);
    reply.send(updatedReport); // { boarding_report: { ... } }
  } catch (err) {
    reply.code(400).send({ error: err.message || 'Failed to update boarding report.' });
  }
}

export async function remove(req, reply) {
  try {
    const supabase = req.server.supabase;
    const { id } = req.params;
    if (!id) return reply.code(400).send({ error: "Missing id parameter." });
    await services.deleteBoardingReport(supabase, id);
    reply.send({ success: true });
  } catch (err) {
    reply.code(400).send({ error: err.message || 'Failed to delete boarding report.' });
  }
}

// --------- EXTRA CONTROLLERS: COMPLETE-TASK & PUSH-TO-CLIENT ---------

export async function completeTask(req, reply) {
  try {
    const supabase = req.server.supabase;
    const { id } = req.params;
    const { task_key, completed_by, timestamp } = req.body;
    if (!id || !task_key || !completed_by) {
      return reply.code(400).send({ error: 'Missing required fields for task completion.' });
    }
    const result = await services.completeBoardingReportTask(
      supabase,
      id,
      task_key,
      completed_by,
      timestamp
    );
    reply.send(result); // { boarding_report: { ... } }
  } catch (err) {
    reply.code(400).send({ error: err.message || 'Failed to complete boarding report task.' });
  }
}

export async function pushToClient(req, reply) {
  try {
    const supabase = req.server.supabase;
    const { id } = req.params;
    const { type, message } = req.body;
    if (!id || !type) {
      return reply.code(400).send({ error: 'Missing required fields for push-to-client.' });
    }
    const result = await services.pushBoardingReportToClient(
      supabase,
      id,
      type,
      message
    );
    reply.send(result); // { success: true }
  } catch (err) {
    reply.code(400).send({ error: err.message || 'Failed to push update to client.' });
  }
}

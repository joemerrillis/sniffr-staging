import createDaycareSession from '../services/createDaycareSession.js';

export async function create(req, reply) {
  try {
    // Attach server/user context to payload if not present
    const user_id = req.user?.id || req.body.user_id;
    const server = req.server;
    const payload = { ...req.body, user_id };

    const { daycare_session, pending_service, breakdown, requiresApproval } =
      await createDaycareSession(server, payload);

    reply.code(201).send({
      daycare_session,
      pending_service,
      breakdown,
      requiresApproval
    });
  } catch (e) {
    reply.code(400).send({ error: e.message || e });
  }
}

export async function previewPrice(request, reply) {
  try {
    const { tenant_id, service_type, ...serviceData } = request.body;
    if (!tenant_id || !service_type) {
      return reply.code(400).send({ error: "Missing tenant_id or service_type", received: request.body });
    }
    const { price, breakdown, error } = await previewServicePrice(request.server, {
      tenant_id, service_type, ...serviceData
    });
    if (error) {
      return reply.code(400).send({ error, breakdown });
    }
    reply.send({ price, breakdown });
  } catch (err) {
    reply.code(500).send({ error: err.message || err });
  }
}

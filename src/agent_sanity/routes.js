async function agentSanityRoutes(fastify) {
  /**
   * GET /_agent/health
   * Returns a simple health check response
   */
  fastify.get('/_agent/health', {
    schema: {
      description: 'Trivial health check endpoint',
      response: {
        200: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' }
          }
        }
      }
    }
  }, async () => {
    return { ok: true };
  });
}

module.exports = agentSanityRoutes;

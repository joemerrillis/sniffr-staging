async function agentSanityRoutes(fastify, options) {
  /**
   * @openapi
   * /_agent/health:
   *   get:
   *     summary: Agent sanity health check
   *     responses:
   *       200:
   *         description: Returns ok true if agent is running
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 ok:
   *                   type: boolean
   *                   example: true
   */
  fastify.get('/_agent/health', async function (request, reply) {
    return { ok: true };
  });
}

module.exports = agentSanityRoutes;

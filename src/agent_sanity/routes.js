async function agentSanityRoutes(fastify, opts) {
  /**
   * @openapi
   * /_agent/health:
   *   get:
   *     summary: Agent health check endpoint
   *     responses:
   *       200:
   *         description: Returns ok: true if agent is healthy
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 ok:
   *                   type: boolean
   *                   example: true
   */
  fastify.get('/_agent/health', async () => {
    return { ok: true };
  });
}

module.exports = agentSanityRoutes;

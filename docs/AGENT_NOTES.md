# Agent Sanity Plugin

This plugin adds a minimal Fastify route to check the health status of the agent.

## Route

- `GET /_agent/health`  
  Returns JSON: `{ "ok": true }` indicating that the agent is running.

## How to test

1. Start the Sniffr agent server normally.
2. Send a GET request to the following endpoint:
   ```bash
   curl http://localhost:<agent-port>/_agent/health
   ```
3. You should receive the following JSON response:
   ```json
   { "ok": true }
   ```

Replace `<agent-port>` with the port your Sniffr agent listens on.

## Notes

- If OpenAPI (Swagger) documentation is used, this route is documented with a minimal schema.
- This plugin is designed to be trivial, safe, and without dependencies or DB changes.

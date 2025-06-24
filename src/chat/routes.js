// src/chat/routes.js

import chatRoutes from './routes/chatRoutes.js';
import participantRoutes from './routes/participantRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import reactionRoutes from './routes/reactionRoutes.js';
import readRoutes from './routes/readRoutes.js';

export default async function (fastify, opts) {
  await chatRoutes(fastify, opts);
  await participantRoutes(fastify, opts);
  await messageRoutes(fastify, opts);
  await reactionRoutes(fastify, opts);
  await readRoutes(fastify, opts);
}

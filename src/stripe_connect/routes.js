// routes.js

import {
  startStripeConnect,
  stripeConnectCallback
} from './controllers/stripeConnectController.js';

export default function (fastify, opts, done) {
  fastify.get('/stripe/connect/start', {
    schema: {
      response: { 200: { $ref: 'StripeConnectStartResponse#' } },
      tags: ['StripeConnect']
    }
  }, startStripeConnect);

  fastify.get('/stripe/connect/callback', {
    schema: {
      response: { 200: { $ref: 'StripeConnectCallbackResponse#' } },
      tags: ['StripeConnect']
    }
  }, stripeConnectCallback);

  done();
}

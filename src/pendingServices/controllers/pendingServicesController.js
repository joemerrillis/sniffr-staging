// src/pendingServices/controllers/pendingServicesController.js

import {
  listPendingServicesForUser,
  getPendingServiceForUser,
  listPendingServicesForClient,
  deletePendingService,
  deletePendingServiceAsTenant
} from '../services/pendingServicesService.js';

import { previewPrice } from '../../pricingRules/services/pricingEngine.js';

/**
 * Extract the authenticated user's ID from the JWT.
 */
function getUserId(request) {
  return request.user.id ?? request.user.sub;
}

/**
 * Helper: For a pending_service row, construct the correct context object for price preview.
 */
function buildWalkPreviewContext(row) {
  // Try to derive day_of_week from service_date if not present
  let day_of_week = row.day_of_week;
  if (!day_of_week && row.service_date) {
    day_of_week = new Date(row.service_date).getDay();
  }
  // Use window_start if available, fallback to details.start
  let window_start = row.window_start;
  if (!window_start && row.details?.start) window_start = row.details.start;

  // Compose the full context
  return {
    tenant_id: row.tenant_id,
    user_id: row.user_id,
    dog_ids: row.dog_ids || [],
    walk_length_minutes: row.walk_length_minutes || row.details?.walk_length_minutes,
    day_of_week,
    window_start,
    service_date: row.service_date,
    // Pass *everything* for maximum match potential
    ...row.details,
    // The actual row is also available as context for future-proofing
    __raw: row
  };
}

/**
 * List all pending services for the current user (client), with live price preview.
 */
async function list(request, reply) {
  const userId = getUserId(request);
  const pending_services = await listPendingServicesForUser(request.server, userId);

  const pendingWithPrice = await Promise.all(
    pending_services.map(async (row) => {
      // Build the context for this service
      const context = buildWalkPreviewContext(row);
      // Log all context and row data
      console.log('[pendingServicesController][DEBUG] Preview context:', JSON.stringify(context, null, 2));
      // Determine service type: if "walk_window" or something else
      let service_type = row.service_type || context.service_type || 'walk_window';
      // Allow override by row if needed in future
      const price_preview = await previewPrice(request.server, service_type, context);
      console.log('[pendingServicesController][DEBUG] Price preview result:', JSON.stringify(price_preview, null, 2));
      // Attach preview inline
      return { ...row, price_preview };
    })
  );

  reply.send({ pending_services: pendingWithPrice });
}

/**
 * Get a single pending service by id (for the current user).
 */
async function retrieve(request, reply) {
  const userId = getUserId(request);
  const { id } = request.params;
  const row = await getPendingServiceForUser(request.server, userId, id);
  if (!row) return reply.code(404).send({ error: 'Pending service not found' });

  // Build and log context for preview
  const context = buildWalkPreviewContext(row);
  console.log('[pendingServicesController][DEBUG] Preview context (single):', JSON.stringify(context, null, 2));
  let service_type = row.service_type || context.service_type || 'walk_window';
  const price_preview = await previewPrice(request.server, service_type, context);
  console.log('[pendingServicesController][DEBUG] Price preview result (single):', JSON.stringify(price_preview, null, 2));

  reply.send({ pending_service: { ...row, price_preview } });
}

/**
 * Delete a pending service (remove from cart) by id (for the current user).
 */
async function remove(request, reply) {
  const userId = getUserId(request);
  const { id } = request.params;
  await deletePendingService(request.server, userId, id);
  reply.code(204).send();
}

/**
 * TENANT: List all pending services for a specific client, with price preview.
 */
async function listForClient(request, reply) {
  const { tenant_id, client_id } = request.params;
  const pending_services = await listPendingServicesForClient(request.server, client_id);

  const pendingWithPrice = await Promise.all(
    pending_services.map(async (row) => {
      const context = buildWalkPreviewContext(row);
      console.log('[pendingServicesController][DEBUG][tenant] Preview context:', JSON.stringify(context, null, 2));
      let service_type = row.service_type || context.service_type || 'walk_window';
      const price_preview = await previewPrice(request.server, service_type, context);
      console.log('[pendingServicesController][DEBUG][tenant] Price preview result:', JSON.stringify(price_preview, null, 2));
      return { ...row, price_preview };
    })
  );

  reply.send({ pending_services: pendingWithPrice });
}

/**
 * TENANT: Delete a pending service for a client (if needed).
 */
async function removeForClient(request, reply) {
  const { tenant_id, client_id, id } = request.params;
  await deletePendingServiceAsTenant(request.server, client_id, id);
  reply.code(204).send();
}

export {
  list,
  retrieve,
  remove,
  listForClient,
  removeForClient
};

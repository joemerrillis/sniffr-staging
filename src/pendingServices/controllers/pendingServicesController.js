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
 * Normalize dog IDs from legacy and modern structures.
 */
function normalizeDogIds(row) {
  if (Array.isArray(row.dog_ids)) return row.dog_ids;
  if (row.dog_id) return [row.dog_id];
  if (Array.isArray(row.details?.dog_ids)) return row.details.dog_ids;
  if (row.details?.dog_id) return [row.details.dog_id];
  return [];
}

/**
 * Helper: For a pending_service row, construct the correct context object for price preview.
 * Handles both walk and boarding service types.
 */
function buildPendingServicePreviewContext(row) {
  // Determine service type
  const serviceType = row.service_type || row.details?.service_type || 'walk_window';

  // Defaults
  let context = {
    tenant_id: row.tenant_id,
    user_id: row.user_id,
    dog_ids: normalizeDogIds(row),
    service_type: serviceType,
    service_date: row.service_date,
    ...row.details, // always spread details
    __raw: row
  };

  // Walk window-specific
  if (serviceType === 'walk_window' || serviceType === 'walk') {
    let day_of_week = row.day_of_week;
    if (!day_of_week && row.service_date) {
      day_of_week = new Date(row.service_date).getDay();
    }
    let window_start = row.window_start;
    if (!window_start && row.details?.start) window_start = row.details.start;

    context = {
      ...context,
      walk_length_minutes: row.walk_length_minutes || row.details?.walk_length_minutes,
      day_of_week,
      window_start
    };
  }

  // Boarding-specific
  if (serviceType === 'boarding') {
    // Ensure drop_off_day and pick_up_day are present in context (from either row or details)
    context.drop_off_day = row.drop_off_day || row.details?.drop_off_day || null;
    context.pick_up_day  = row.pick_up_day  || row.details?.pick_up_day  || null;

    // Optionally add times if available
    context.drop_off_time = row.drop_off_time || row.details?.drop_off_time || null;
    context.pick_up_time  = row.pick_up_time  || row.details?.pick_up_time  || null;
    // For compatibility, can add more fields as needed
  }

  return context;
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
      const context = buildPendingServicePreviewContext(row);
      // Log all context and row data
      console.log('[pendingServicesController][DEBUG] Preview context:', JSON.stringify(context, null, 2));
      // Determine service type
      let service_type = context.service_type;
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
  const context = buildPendingServicePreviewContext(row);
  console.log('[pendingServicesController][DEBUG] Preview context (single):', JSON.stringify(context, null, 2));
  let service_type = context.service_type;
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
      const context = buildPendingServicePreviewContext(row);
      console.log('[pendingServicesController][DEBUG][tenant] Preview context:', JSON.stringify(context, null, 2));
      let service_type = context.service_type;
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

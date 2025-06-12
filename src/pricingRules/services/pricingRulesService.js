// src/pricingRules/services/pricingRulesService.js

import { previewPrice } from './pricingEngine.js';

// ---------------------------
// CRUD: Pricing Rules
// ---------------------------
export async function listPricingRules(server, tenant_id) {
  const { data, error } = await server.supabase
    .from('pricing_rules')
    .select('*')
    .eq('tenant_id', tenant_id)
    .order('priority', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createPricingRule(server, rule) {
  const { data, error } = await server.supabase
    .from('pricing_rules')
    .insert([rule])
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updatePricingRule(server, id, updates) {
  updates.updated_at = new Date().toISOString();
  const { data, error } = await server.supabase
    .from('pricing_rules')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deletePricingRule(server, id) {
  const { error } = await server.supabase
    .from('pricing_rules')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ---------------------------
// Service Data Fetching (for price preview/calc)
// ---------------------------
async function fetchServiceData(server, { service_type, service_id }) {
  // Extend this as new service types are added.
  const lookups = {
    'boarding': 'boardings',
    'daycare': 'daycare_sessions',
    'walk_window': 'client_walk_windows',
    'walk_request': 'client_walk_requests'
  };
  const table = lookups[service_type];
  if (!table) throw new Error(`Unsupported service_type: ${service_type}`);
  const { data, error } = await server.supabase.from(table).select('*').eq('id', service_id).single();
  if (error) throw new Error(`[PricingRules] No ${service_type} found for id: ${service_id}`);
  return data;
}

// ---------------------------
// Price Preview (unified)
// ---------------------------
/**
 * Main entrypoint for price preview/calc.
 * - If service_id is provided, fetches base row from DB.
 * - Merges serviceData with additional context for price previewing.
 * - All price math is handled in pricingEngine.js (single source of truth).
 * Returns: { price, breakdown } (optionally serviceData in dev)
 */
export async function previewServicePrice(server, { tenant_id, service_type, service_id, ...context }) {
  let serviceData = {};
  // If service_id is present, fetch service instance from DB (boarding, walk, etc)
  if (service_id) {
    serviceData = await fetchServiceData(server, { service_type, service_id });
  }

  // Merge DB row with any additional form/preview context
  // Context (form data) takes precedence for “what-if” price previews
  const finalContext = { ...serviceData, ...context, tenant_id, service_type };

  // Run through pricing engine for actual calculation
  const result = await previewPrice(server, service_type, finalContext);

  // In dev, you can return serviceData for easier debugging
  if (process.env.NODE_ENV !== 'production') {
    return { ...result, serviceData };
  }
  // In prod, keep response clean
  return result;
}

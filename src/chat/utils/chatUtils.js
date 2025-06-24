// src/chat/utils/chatUtils.js

export function getSupabase(request) {
  return request.server?.supabase || request.supabase || request.app?.supabase;
}
export function getUserId(request) {
  return request.user?.id || request.auth?.userId || request.headers['x-user-id'];
}
export function getTenantId(request) {
  return request.user?.tenant_id || request.headers['x-tenant-id'];
}

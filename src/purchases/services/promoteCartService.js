// src/purchases/services/promoteCartService.js
import supabase from '../../core/supabase.js';

// TODO: make this atomic and idempotent!
export async function promoteCart(purchase) {
  // For each pending_service in purchase.cart:
  //   - Look up the pending_service details
  //   - Promote to walks/boardings/daycare_sessions as needed
  //   - Remove from pending_services
  //   - Notify users
  // This is a complex business rule—stub for now.
}

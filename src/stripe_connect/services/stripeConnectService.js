// services/stripeConnectService.js

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function getStripeConnectOAuthUrl(tenantId) {
  // Create a state param (tenantId + random token for CSRF)
  const state = encodeURIComponent(`${tenantId}.${Math.random().toString(36).substr(2, 9)}`);
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.STRIPE_CLIENT_ID,
    scope: 'read_write',
    redirect_uri: process.env.STRIPE_CONNECT_REDIRECT_URI,
    state
  });
  const url = `https://connect.stripe.com/oauth/authorize?${params.toString()}`;
  return { url, state };
}

export async function handleStripeConnectCallback({ code, state }, supabase) {
  if (!code || !state) {
    throw new Error('Missing required parameters');
  }

  // Extract tenantId from state
  const [tenantId] = state.split('.');

  // Exchange the code for account tokens
  let response;
  try {
    response = await stripe.oauth.token({
      grant_type: 'authorization_code',
      code
    });
  } catch (err) {
    throw new Error('Stripe OAuth failed: ' + err.message);
  }

  const stripeAccountId = response.stripe_user_id;
  if (!stripeAccountId) {
    throw new Error('Missing stripe_user_id in Stripe OAuth response');
  }

  // Save stripe_account_id to tenants table
  const { error } = await supabase
    .from('tenants')
    .update({ stripe_account_id: stripeAccountId })
    .eq('id', tenantId);

  if (error) {
    throw new Error('Failed to update tenant with stripe_account_id: ' + error.message);
  }

  return { success: true };
}

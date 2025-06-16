// src/dog_memories/services/cloudflareImages.js

import fetch from 'node-fetch';
import FormData from 'form-data';

// Your account and API info
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_IMAGES_TOKEN = process.env.CLOUDFLARE_IMAGES_TOKEN;

// The main upload function
export async function uploadToCloudflareImages({ fileBuffer, fileName, metadata }) {
  const form = new FormData();
  form.append('file', fileBuffer, fileName);
  if (metadata) form.append('metadata', JSON.stringify(metadata));

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_IMAGES_TOKEN}`,
      },
      body: form,
    }
  );

  const result = await res.json();
  if (!result.success) throw new Error(result.errors?.[0]?.message || 'Cloudflare upload failed');
  return result.result; // contains {id, filename, uploaded, etc}
}

// src/walk_reports/service/uploadWalkReportAudio.js

import fs from 'fs/promises';
import fetch from 'node-fetch';

// Helper for calling a worker (mirrors your generate pattern)
async function callWorker(url, payload) {
  console.log(`[AudioUploader] Calling worker at ${url}...`);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Worker at ${url} error: ${err}`);
  }
  const result = await res.json();
  console.log(`[AudioUploader] Worker response:`, JSON.stringify(result, null, 2));
  return result;
}

export async function uploadWalkReportAudioService({ walkReportId, audioFile }) {
  // NOTE: audioFile.filepath is the temp file path saved by fastify-multipart
  const audioFilePath = audioFile.filepath || audioFile.path;

  try {
    // Read file as base64 (or buffer, depending on worker API)
    const audioBuffer = await fs.readFile(audioFilePath);
    const audioBase64 = audioBuffer.toString('base64');

    // Build payload for Cloudflare Worker
    const payload = {
      walk_report_id: walkReportId,
      filename: audioFile.filename,
      mimetype: audioFile.mimetype,
      audio_base64: audioBase64
      // Add any other needed metadata here
    };

    // Call the worker
    const workerResult = await callWorker(process.env.CF_AUDIO_TRANSCRIBE_URL, payload);

    // Optionally clean up temp file
    await fs.unlink(audioFilePath);

    return {
      message: workerResult.message || 'Audio processed',
      transcript: workerResult.transcript,
      filename: workerResult.filename || audioFile.filename
    };
  } catch (err) {
    // Attempt to clean up temp file on error
    if (audioFilePath) {
      try { await fs.unlink(audioFilePath); } catch {}
    }
    throw err;
  }
}

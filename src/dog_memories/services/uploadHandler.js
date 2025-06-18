// src/dog_memories/services/uploadHandler.js

import { uploadToCloudflareImages } from './cloudflareImages.js'; // adjust path if needed

export async function handleDogMemoryUpload(request, reply, fastify) {
  fastify.log.info('UPLOAD HANDLER STARTED');
  const parts = request.parts();
  let count = 0;
  let fileCount = 0;
  let fieldCount = 0;
  let partNames = [];
  let fileBuffer = null;
  let fileInfo = null;
  let fields = {};

  try {
    for await (const part of parts) {
      count++;
      if (part.file) {
        fileCount++;
        partNames.push(part.filename || 'unnamed-file');
        fastify.log.info({ partNum: count, filename: part.filename, mimetype: part.mimetype }, 'File part received');

        // Buffer the file as soon as it's seen
        fastify.log.info('About to buffer file part...');
        fileBuffer = await streamToBuffer(part.file, fastify);
        fileInfo = { filename: part.filename, mimetype: part.mimetype };
        fastify.log.info({ bufferLength: fileBuffer.length }, 'File part buffered');
      } else if (part.fieldname) {
        fieldCount++;
        fields[part.fieldname] = part.value;
        partNames.push(part.fieldname);
        fastify.log.info({ partNum: count, field: part.fieldname, value: part.value }, 'Field part received');
      } else {
        fastify.log.warn({ partNum: count }, 'Unknown part type received');
      }
    }

    fastify.log.info({ count, fileCount, fieldCount, partNames }, 'All parts processed, starting Cloudflare upload');

    if (!fileBuffer) {
      fastify.log.warn('No file uploaded');
      return reply.code(400).send({ error: 'No file uploaded' });
    }

    // === CLOUDLFARE UPLOAD STEP ===
    let cloudflareResp;
    try {
      fastify.log.info('About to upload to Cloudflare Images...');
      cloudflareResp = await uploadToCloudflareImages({
        fileBuffer,
        fileName: fileInfo.filename,
        metadata: fields
      });
      fastify.log.info({ cloudflareResp }, 'Cloudflare upload finished');
    } catch (err) {
      fastify.log.error({ err }, 'Cloudflare upload failed');
      return reply.code(502).send({ error: 'Cloudflare upload failed', details: err.message });
    }

    // Return full info for debugging
    return reply.code(201).send({
      ok: true,
      message: "File buffered and uploaded to Cloudflare",
      bufferLength: fileBuffer.length,
      fileInfo,
      fields,
      cloudflareResp,
      partsSeen: count,
      filesSeen: fileCount,
      fieldsSeen: fieldCount,
      partNames
    });

  } catch (err) {
    fastify.log.error({ err, count }, 'Error in upload handler');
    return reply.code(500).send({ error: err.message || 'Upload handler failed' });
  }
}

async function streamToBuffer(stream, fastify) {
  fastify.log.info('streamToBuffer started');
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);
  fastify.log.info({ bufferLength: buffer.length }, 'streamToBuffer complete');
  return buffer;
}

import { uploadToCloudflareImages } from './cloudflareImages.js';
import { insertDogMemory } from '../models/dogMemoryModel.js';

export async function handleDogMemoryUpload(request, reply, fastify) {
  fastify.log.info('Starting upload handler');
  const parts = request.parts();
  let file = null;
  const fields = {};

  for await (const part of parts) {
    if (part.file) {
      if (!file) {
        fastify.log.info({ filename: part.filename, mimetype: part.mimetype }, 'File part received');
        file = part;
      } else {
        fastify.log.warn({ filename: part.filename }, 'Extra file part detected, discarding');
        await part.file.resume();
      }
    } else if (part.fieldname) {
      fastify.log.info({ field: part.fieldname, value: part.value }, 'Field part received');
      fields[part.fieldname] = part.value;
    }
  }
  fastify.log.info('All parts processed, file and fields extracted');

  if (!file) {
    fastify.log.warn('No file uploaded!');
    return reply.code(400).send({ error: 'Image file required' });
  }

  // Parse dog_ids to array (expects CSV string from form)
  let dog_ids = [];
  if (fields.dog_ids) {
    dog_ids = Array.isArray(fields.dog_ids)
      ? fields.dog_ids
      : fields.dog_ids.split(',').map(id => id.trim()).filter(Boolean);
  }

  fastify.log.info('About to read file stream...');
  let fileBuffer;
  try {
    fileBuffer = await streamToBuffer(file.file, fastify);
    fastify.log.info('File buffer created, length: ' + fileBuffer.length);
  } catch (err) {
    fastify.log.error({ err }, 'Error while reading file stream to buffer');
    return reply.code(500).send({ error: 'Could not read file upload' });
  }

  let cloudflareResp;
  try {
    fastify.log.info('About to upload to Cloudflare...');
    cloudflareResp = await uploadToCloudflareImages({
      fileBuffer,
      fileName: file.filename,
      metadata: { dog_ids, event_id: fields.event_id }
    });
    fastify.log.info({ cloudflareResp }, 'Cloudflare upload finished');
  } catch (err) {
    fastify.log.error({ err }, 'Error during upload to Cloudflare Images');
    return reply.code(502).send({ error: err.message || 'Failed to upload to Cloudflare Images' });
  }

  // Insert into DB
  try {
    fastify.log.info('About to insert into DB...');
    const newMemory = await insertDogMemory({
      image_id: cloudflareResp.id,
      dog_ids,
      uploader_id: request.user?.id || null,
      event_id: fields.event_id,
      image_url: `https://imagedelivery.net/9wUa4dldcGfmWFQ1Xyg0gA/${cloudflareResp.id}`,
      caption: fields.caption || 'Photo upload',
      event_type: fields.event_type || 'manual'
    });
    fastify.log.info({ newMemory }, 'DB insert finished');

    reply.code(201).send({ memory: newMemory });
    fastify.log.info('Upload route completed');
  } catch (err) {
    fastify.log.error({ err }, 'Upload failed');
    reply.code(500).send({ error: err.message || 'Upload failed' });
  }
}

async function streamToBuffer(stream, fastify) {
  fastify.log.info('Starting streamToBuffer...');
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);
  fastify.log.info({ bufferLength: buffer.length }, 'streamToBuffer complete');
  return buffer;
}

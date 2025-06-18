// src/dog_memories/services/uploadHandler.js

export async function handleDogMemoryUpload(request, reply, fastify) {
  fastify.log.info('UPLOAD HANDLER STARTED');
  const parts = request.parts();
  let count = 0;
  let fileCount = 0;
  let fieldCount = 0;
  let partNames = [];
  let filePart = null;
  try {
    for await (const part of parts) {
      count++;
      if (part.file) {
        if (!filePart) {
          filePart = part; // Save reference, DO NOT resume/drain!
        }
        fileCount++;
        partNames.push(part.filename || 'unnamed-file');
        fastify.log.info({ partNum: count, filename: part.filename, mimetype: part.mimetype }, 'File part received');
        // DO NOT: await part.file.resume();
      } else if (part.fieldname) {
        fieldCount++;
        partNames.push(part.fieldname);
        fastify.log.info({ partNum: count, field: part.fieldname, value: part.value }, 'Field part received');
      } else {
        fastify.log.warn({ partNum: count }, 'Unknown part type received');
      }
    }
    fastify.log.info({ count, fileCount, fieldCount, partNames }, 'All parts processed, starting file buffer step');

    if (fileCount < 1 || !filePart) {
      fastify.log.warn('No file uploaded');
      return reply.code(400).send({ error: 'No file uploaded' });
    }

    let fileBuffer;
    try {
      fastify.log.info('About to read file stream into buffer...');
      fileBuffer = await streamToBuffer(filePart.file, fastify);
      fastify.log.info({ bufferLength: fileBuffer.length }, 'File buffer created');
      return reply.code(200).send({
        ok: true,
        message: "File buffered successfully",
        bufferLength: fileBuffer.length,
        partsSeen: count,
        filesSeen: fileCount,
        fieldsSeen: fieldCount,
        partNames
      });
    } catch (err) {
      fastify.log.error({ err }, 'Failed to buffer file');
      return reply.code(500).send({ error: 'Could not buffer file' });
    }
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

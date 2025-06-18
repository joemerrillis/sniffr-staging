// src/dog_memories/services/uploadHandler.js

export async function handleDogMemoryUpload(request, reply, fastify) {
  fastify.log.info('UPLOAD HANDLER STARTED');
  const parts = request.parts();
  let count = 0;
  let fileCount = 0;
  let fieldCount = 0;
  let partNames = [];
  try {
    for await (const part of parts) {
      count++;
      if (part.file) {
        fileCount++;
        partNames.push(part.filename || 'unnamed-file');
        fastify.log.info({ partNum: count, filename: part.filename, mimetype: part.mimetype }, 'File part received');
        await part.file.resume(); // Always drain files!
      } else if (part.fieldname) {
        fieldCount++;
        partNames.push(part.fieldname);
        fastify.log.info({ partNum: count, field: part.fieldname, value: part.value }, 'Field part received');
      } else {
        fastify.log.warn({ partNum: count }, 'Unknown part type received');
      }
    }
    fastify.log.info({ count, fileCount, fieldCount, partNames }, 'All parts processed, sending response');
    return reply.code(200).send({
      ok: true,
      message: "Upload handler test: stream drained and response sent",
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

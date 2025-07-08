// src/walk_reports/controller/uploadWalkReportAudio.js

import { uploadWalkReportAudioService } from '../service/uploadWalkReportAudio.js';

export async function uploadWalkReportAudioController(req, reply) {
  try {
    const { id } = req.params;
    // Use fastify-multipart to get uploaded files (array, can be empty)
    const files = await req.saveRequestFiles();

    const audioFile = files.find(f => f.fieldname === 'audio');
    if (!audioFile) {
      return reply.code(400).send({
        success: false,
        message: 'No audio file uploaded. Please use field name "audio".'
      });
    }

    // Optionally: Validate file type, size, etc. (MIME/type check)
    if (!audioFile.mimetype.startsWith('audio/')) {
      return reply.code(400).send({
        success: false,
        message: 'Uploaded file is not an audio file.'
      });
    }

    // Optionally: Add authentication/userId info here if needed

    // Call the service to handle further processing (send to Cloudflare Worker, etc)
    const result = await uploadWalkReportAudioService({
      walkReportId: id,
      audioFile
      // Optionally: userId, metadata, etc.
    });

    return reply.send({
      success: true,
      message: result.message || 'Audio file processed',
      transcript: result.transcript,   // If the worker returns it, else omit
      filename: result.filename        // Optionally return storage filename
    });
  } catch (error) {
    req.log.error({ err: error }, '[walkReportAudioController] Upload failed');
    return reply.code(500).send({
      success: false,
      message: error.message || 'Audio upload failed'
    });
  }
}

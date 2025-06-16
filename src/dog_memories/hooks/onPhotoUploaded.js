// src/dog_memories/hooks/onPhotoUploaded.js
import { onPhotoUploaded } from '../services/mediaProcessing.js';

export async function handlePhotoUploadEvent({ objectKey, metadata }) {
  // Process the photo (AI tagging, vector search, etc)
  return onPhotoUploaded({ objectKey, metadata });
}

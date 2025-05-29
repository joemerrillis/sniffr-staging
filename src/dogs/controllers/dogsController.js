// src/dogs/controllers/dogsController.js

import {
  listDogs,
  getDog,
  createDog,
  updateDog,
  deleteDog,
  generatePhotoUploadUrl,
  createDogOwner // <-- Add this import!
} from '../services/dogsService.js';

/**
 * GET /dogs
 */
export async function list(request, reply) {
  const dogs = await listDogs(request.server);
  reply.send({ dogs });
}

/**
 * GET /dogs/:id
 */
export async function retrieve(request, reply) {
  const { id } = request.params;
  const dog = await getDog(request.server, id);
  if (!dog) {
    return reply.code(404).send({ error: 'Dog not found' });
  }
  reply.send({ dog });
}

/**
 * POST /dogs
 */
export async function create(request, reply) {
  const payload = request.body;
  const user_id = request.user?.id ?? request.user?.sub; // get user_id from JWT

  // 1. Create the dog record
  const dog = await createDog(request.server, payload);

  // 2. Create dog-owner relationship
  await createDogOwner(request.server, { dog_id: dog.id, user_id });

  reply.code(201).send({ dog });
}

/**
 * PATCH /dogs/:id
 */
export async function modify(request, reply) {
  const { id } = request.params;
  const payload = request.body;
  const dog = await updateDog(request.server, id, payload);
  if (!dog) {
    return reply.code(404).send({ error: 'Dog not found' });
  }
  reply.send({ dog });
}

/**
 * DELETE /dogs/:id
 */
export async function remove(request, reply) {
  const { id } = request.params;
  await deleteDog(request.server, id);
  reply.code(204).send();
}

/**
 * GET /dogs/:id/photo/upload-url
 * — Returns a signed URL for the client to upload a dog photo
 */
export async function photoUploadUrl(request, reply) {
  const { id: dogId } = request.params;
  const signedUrl = await generatePhotoUploadUrl(request.server, dogId);
  reply.send({ url: signedUrl });
}

/**
 * GET /dogs/owners/:ownerId/media/export
 * — Stub; implement real export logic (e.g. zip & stream) as needed
 */
export async function exportOwnerMedia(request, reply) {
  const { ownerId } = request.params;
  // TODO: fetch & package owner’s media, then stream or send back
  reply.send({ media: [] });
}

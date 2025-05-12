// src/dogs/controllers/dogsController.js

import {
-  listDogs,
-  getDogById,
-  createDog,
-  updateDog,
-  deleteDog,
-  generatePhotoUploadUrl
+  listDogs,
+  getDog,
+  createDog,
+  updateDog,
+  deleteDog,
+  generatePhotoUploadUrl
} from '../services/dogsService.js';

export async function list(request, reply) {
  const dogs = await listDogs(request.server);
  reply.send({ dogs });
}

export async function retrieve(request, reply) {
  const { id } = request.params;
-  const dog = await getDogById(request.server, id);
+  const dog = await getDog(request.server, id);
  if (!dog) return reply.code(404).send({ error: 'Dog not found' });
  reply.send({ dog });
}

export async function create(request, reply) {
  const payload = request.body;
  const dog = await createDog(request.server, payload);
  reply.code(201).send({ dog });
}

export async function modify(request, reply) {
  const { id } = request.params;
  const payload = request.body;
-  const dog = await updateDog(request.server, id, payload);
+  const dog = await updateDog(request.server, id, payload);
  if (!dog) return reply.code(404).send({ error: 'Dog not found' });
  reply.send({ dog });
}

export async function remove(request, reply) {
  const { id } = request.params;
  await deleteDog(request.server, id);
  reply.code(204).send();
}

export async function photoUrl(request, reply) {
  const { dogId } = request.params;
  const { signedUrl } = await generatePhotoUploadUrl(request.server, dogId);
  reply.send({ url: signedUrl });
}

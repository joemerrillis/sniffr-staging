import {
  getVisibilityByDogId,
  createVisibilityForDogId,
  setVisibilityByDogId,
  deleteVisibilityByDogId
} from '../services/dogVisibilityService.js';

export async function createVisibility(request, reply) {
  const dogId     = request.params.id;
  const { is_visible } = request.body;

  // Insert a new row
  const visibility = await createVisibilityForDogId(request.server, dogId, is_visible);

  reply.code(201).send({ visibility });
}

export async function getVisibility(request, reply) {
  const dogId = request.params.id;

  const visibility = await getVisibilityByDogId(request.server, dogId);
  reply.send({ visibility });
}

export async function updateVisibility(request, reply) {
  const dogId     = request.params.id;
  const { is_visible } = request.body;

  const visibility = await setVisibilityByDogId(request.server, dogId, is_visible);
  reply.send({ visibility });
}

export async function deleteVisibility(request, reply) {
  const dogId = request.params.id;

  await deleteVisibilityByDogId(request.server, dogId);
  reply.code(204).send();
}

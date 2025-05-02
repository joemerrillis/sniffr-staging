import {
  getVisibilityByDogId,
  setVisibilityByDogId
} from '../services/dogVisibilityService.js';

export async function getVisibility(request, reply) {
  const dogId = request.params.id;
  let visibility;
  try {
    visibility = await getVisibilityByDogId(request.server, dogId);
  } catch (err) {
    return reply.code(404).send({ error: `Visibility for dog ${dogId} not found` });
  }
  reply.send({ visibility });
}

export async function updateVisibility(request, reply) {
  const dogId = request.params.id;
  const { is_visible } = request.body;
  let visibility;
  try {
    visibility = await setVisibilityByDogId(request.server, dogId, is_visible);
  } catch (err) {
    return reply.code(404).send({ error: `Dog ${dogId} not found` });
  }
  reply.send({ visibility });
}
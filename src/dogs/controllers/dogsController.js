import {
  listDogs,
  getDogById,
  createDog,
  updateDog,
  deleteDog,
  generatePhotoUploadUrl,
  getOwnerMedia
} from '../services/dogsService.js';
import archiver from 'archiver';

export async function list(request, reply) {
  const tenantId = request.query.tenant_id;
  const ownerId = request.query.owner_id;
  const dogs = await listDogs(request.server, tenantId, ownerId);
  reply.send({ dogs });
}

export async function retrieve(request, reply) {
  const id = request.params.id;
  let dog;
  try {
    dog = await getDogById(request.server, id);
  } catch (err) {
    return reply.code(404).send({ message: `Dog ${id} not found.` });
  }
  reply.send({ dog });
}

export async function create(request, reply) {
  const payload = request.body;
  const dog = await createDog(request.server, payload);
  reply.code(201).send({ dog });
}

export async function modify(request, reply) {
  const id = request.params.id;
  const payload = request.body;
  let dog;
  try {
    dog = await updateDog(request.server, id, payload);
  } catch (err) {
    return reply.code(404).send({ message: `Dog ${id} not found.` });
  }
  reply.send({ dog });
}

export async function remove(request, reply) {
  const id = request.params.id;
  try {
    await deleteDog(request.server, id);
  } catch (err) {
    return reply.code(404).send({ message: `Dog ${id} not found.` });
  }
  reply.code(204).send();
}

export async function photoUploadUrl(request, reply) {
  const id = request.params.id;
  const tenantId = request.request.tenantId || request.tenantId;
  const { uploadUrl, uploadMethod, uploadHeaders, publicUrl } =
    await generatePhotoUploadUrl(request.server, tenantId, id);
  reply.send({ uploadUrl, uploadMethod, uploadHeaders, publicUrl });
}

export async function exportOwnerMedia(request, reply) {
  const ownerId = request.params.ownerId;
  const mediaItems = await getOwnerMedia(request.server, ownerId);

  reply.header('Content-Type', 'application/zip');
  const archive = archiver('zip');
  archive.pipe(reply.raw);

  mediaItems.forEach(item => {
    archive.append(JSON.stringify(item), { name: `${item.id}.json` });
    // Note: real streaming from URL requires request-pipe; stubbed here
  });

  archive.finalize();
}
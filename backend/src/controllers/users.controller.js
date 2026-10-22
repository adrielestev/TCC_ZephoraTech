import * as users from "../services/users.service.js";
import * as storage from "../services/file-storage.service.js";
import { userView } from "../serializers/user.serializer.js";

async function removePreviousImage(filename) {
  if (!filename) return;
  try { await storage.deleteImage(filename); } catch (error) { console.error("Falha ao remover imagem substituída", error); }
}

export async function list(_req, res) {
  res.json({ users: (await users.listUsers()).map(userView) });
}
export async function updateMe(req, res) {
  res.json({ user: userView(await users.updateProfile(req.user.id, req.body)) });
}
export async function updateRole(req, res) {
  res.json({ user: userView(await users.changeRole(req.user.id, req.params.id, req.body.user_level)) });
}

export async function uploadPhoto(req, res) {
  const previous = await users.getActiveUser(req.user.id);
  const filename = await storage.saveImage(req.validatedImage);
  let updated;
  try {
    updated = await users.updateProfile(req.user.id, { user_photo: filename });
  } catch (error) {
    await storage.deleteImage(filename);
    throw error;
  }
  await removePreviousImage(previous.user_photo);
  res.json({ user: userView(updated) });
}

export async function deletePhoto(req, res) {
  const previous = await users.getActiveUser(req.user.id);
  const updated = await users.updateProfile(req.user.id, { user_photo: null });
  await removePreviousImage(previous.user_photo);
  res.json({ user: userView(updated) });
}

import * as references from "../repositories/media.repository.js";
import { requireRoomAccess } from "./rooms.service.js";
import { HttpError } from "../utils/http-error.js";
import * as storage from "./file-storage.service.js";

export async function readAuthorizedImage(user, filename) {
  const [userPhoto, roomPhoto] = await Promise.all([
    references.findUserPhotoReference(filename),
    references.findRoomPhotoReference(filename),
  ]);
  let authorized = user.user_level === "admin";
  if (userPhoto?.id === user.id) authorized = true;
  if (!authorized && roomPhoto) {
    try {
      await requireRoomAccess(user, roomPhoto.id);
      authorized = true;
    } catch (error) {
      if (!(error instanceof HttpError) || error.status !== 403) throw error;
    }
  }
  if (!authorized || (!userPhoto && !roomPhoto)) throw new HttpError(404, "Imagem não encontrada");
  return storage.readImage(filename);
}

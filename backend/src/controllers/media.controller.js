import * as media from "../services/media.service.js";

export async function getImage(req, res) {
  const image = await media.readAuthorizedImage(req.user, req.params.filename);
  res.set({
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    "Content-Disposition": "inline",
  });
  res.type(image.mime).send(image.buffer);
}

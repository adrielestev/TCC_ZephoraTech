import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env.js";
import { SIGNED_URL_LIFETIME_SECONDS } from "../config/constants.js";

const uploadRoot = path.resolve(process.cwd(), env.UPLOAD_DIR);

export function createSignedMediaUrl(imageUrl) {
  if (!imageUrl) return imageUrl;

  let parsedUrl;
  try {
    parsedUrl = new URL(imageUrl);
  } catch {
    return imageUrl;
  }

  if (parsedUrl.origin !== new URL(env.APP_URL).origin) return imageUrl;
  if (!parsedUrl.pathname.startsWith("/uploads/")) return imageUrl;

  const expiresAt = Math.floor(Date.now() / 1000) + SIGNED_URL_LIFETIME_SECONDS;
  const signature = signMediaPath(parsedUrl.pathname, expiresAt);
  parsedUrl.searchParams.set("expires", String(expiresAt));
  parsedUrl.searchParams.set("signature", signature);
  return parsedUrl.toString();
}

export function authorizeSignedMediaRequest(req, res, next) {
  const pathname = `${req.baseUrl}${req.path}`;
  const expiresAt = Number(req.query.expires);
  const signature = req.query.signature;
  const now = Math.floor(Date.now() / 1000);

  if (
    !Number.isInteger(expiresAt) ||
    expiresAt <= now ||
    expiresAt > now + SIGNED_URL_LIFETIME_SECONDS ||
    typeof signature !== "string"
  ) {
    return res.status(403).json({ error: "Acesso à imagem expirado ou invalido." });
  }

  if (!/^[a-f0-9]+$/i.test(signature)) {
    return res.status(403).json({ error: "Acesso à imagem expirado ou invalido." });
  }

  const expected = Buffer.from(signMediaPath(pathname, expiresAt), "hex");
  const received = Buffer.from(signature, "hex");
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return res.status(403).json({ error: "Acesso à imagem expirado ou invalido." });
  }

  return next();
}

function signMediaPath(pathname, expiresAt) {
  return createHmac("sha256", env.JWT_SECRET)
    .update(`${pathname}:${expiresAt}`)
    .digest("hex");
}

export async function saveImage(file, category) {
  const directory = path.join(uploadRoot, category);
  await mkdir(directory, { recursive: true });

  const filename = `${randomUUID()}.${file.extension}`;
  await writeFile(path.join(directory, filename), file.buffer, { flag: "wx" });

  return `${env.APP_URL}/uploads/${category}/${filename}`;
}

export async function removeImage(imageUrl) {
  if (!imageUrl) return;

  let parsedUrl;
  try {
    parsedUrl = new URL(imageUrl);
  } catch {
    return;
  }

  if (parsedUrl.origin !== new URL(env.APP_URL).origin) return;

  const relativePath = decodeURIComponent(parsedUrl.pathname).replace(
    /^\/uploads\//,
    "",
  );
  const filePath = path.resolve(uploadRoot, relativePath);

  if (!filePath.startsWith(`${uploadRoot}${path.sep}`)) return;

  try {
    await unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env.js";

const uploadRoot = path.resolve(process.cwd(), env.UPLOAD_DIR);

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
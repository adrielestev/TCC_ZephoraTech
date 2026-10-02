import bcrypt from "bcryptjs";
import { SALT_ROUNDS } from "../config/constants.js";

export function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

const storedImageName = /^[a-f0-9-]{36}\.(jpg|png|webp)$/;

export function userView({ password_hash, verification_code_hash, verification_expires_at, verification_attempts, last_code_sent_at, deleted_at, ...user }) {
  return {
    ...user,
    user_photo: storedImageName.test(user.user_photo || "") ? `/api/media/${user.user_photo}` : null,
  };
}

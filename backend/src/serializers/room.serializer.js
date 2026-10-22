const storedImageName = /^[a-f0-9-]{36}\.(jpg|png|webp)$/;

export function roomView(room, isAdmin) {
  const { device_credential_hash, ...safeRoom } = room;
  for (const field of ["room_photo_1", "room_photo_2", "room_photo_3"]) {
    safeRoom[field] = storedImageName.test(safeRoom[field] || "") ? `/api/media/${safeRoom[field]}` : null;
  }
  if (isAdmin) return { ...safeRoom, has_device_credential: Boolean(device_credential_hash) };
  const { mac_address, last_seen_at, ...operatorRoom } = safeRoom;
  return operatorRoom;
}

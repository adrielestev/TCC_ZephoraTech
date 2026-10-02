import { Room } from "../types";
import { ROOM_OFFLINE_THRESHOLD_MS } from "../config/constants";

export type RoomStatus = "online" | "offline" | "unknown";

export function getRoomStatus(lastSeenAt: Room["last_seen_at"]): RoomStatus {
  if (!lastSeenAt) return "unknown";

  const lastSeen = Date.parse(lastSeenAt);
  if (Number.isNaN(lastSeen)) return "unknown";

  return Date.now() - lastSeen <= ROOM_OFFLINE_THRESHOLD_MS ? "online" : "offline";
}

export function getRoomStatusLabel(status: RoomStatus) {
  if (status === "online") return "Online";
  if (status === "offline") return "Offline";
  return "Sem comunicação";
}

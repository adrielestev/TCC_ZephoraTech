export function nowIso() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function secondsSince(isoDate) {
  if (!isoDate) return Number.POSITIVE_INFINITY;
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
}

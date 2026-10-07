export async function getToken(key: string) {
  return globalThis.localStorage.getItem(key);
}

export async function setToken(key: string, value: string) {
  globalThis.localStorage.setItem(key, value);
}

export async function deleteToken(key: string) {
  globalThis.localStorage.removeItem(key);
}

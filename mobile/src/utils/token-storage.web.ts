function getStorage(): Storage | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
    if (typeof globalThis !== "undefined" && globalThis.localStorage) {
      return globalThis.localStorage;
    }
  } catch {
    // Pode falhar caso localStorage esteja restrito pelo navegador
  }
  return null;
}

export async function getToken(key: string): Promise<string | null> {
  return getStorage()?.getItem(key) ?? null;
}

export async function setToken(key: string, value: string): Promise<void> {
  getStorage()?.setItem(key, value);
}

export async function deleteToken(key: string): Promise<void> {
  getStorage()?.removeItem(key);
}


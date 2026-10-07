import { Platform, Share } from "react-native";

export type CopySecretResult = "copied" | "shared" | "cancelled" | "failed";

/**
 * Copia um segredo para a área de transferência.
 * Web: Clipboard API. Nativo: share sheet do sistema (tem a opção "Copiar"),
 * evitando uma dependência nativa extra.
 */
export async function copySecret(value: string): Promise<CopySecretResult> {
  try {
    if (Platform.OS === "web") {
      await globalThis.navigator.clipboard.writeText(value);
      return "copied";
    }

    const result = await Share.share({ message: value });
    return result.action === Share.sharedAction ? "shared" : "cancelled";
  } catch {
    return "failed";
  }
}

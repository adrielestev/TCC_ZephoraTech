import { useLocalSearchParams } from 'expo-router';

/** Lê um parâmetro de rota (ex.: roomId) como número. */
export function useNumericParam(name: string): number {
  const params = useLocalSearchParams<Record<string, string>>();
  return Number(params[name]);
}

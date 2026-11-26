// src/core/hooks/useCountdown.ts -- Fornece um contador regressivo reutilizável para telas com temporizador.
import { useCallback, useEffect, useState } from 'react';

/** Contagem regressiva em segundos (ex.: intervalo para reenviar código). */
export function useCountdown(initialSeconds = 0) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  const start = useCallback((value: number) => setSeconds(value), []);
  return { seconds, start, isRunning: seconds > 0 };
}

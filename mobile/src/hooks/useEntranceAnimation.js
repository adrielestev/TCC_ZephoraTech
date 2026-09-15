import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * Animação de entrada suave (fade + slide-up) para seções de uma tela.
 * Use `delay` para escalonar múltiplos blocos (cabeçalho, cartão, rodapé)
 * e criar uma transição fluida em cascata.
 */
export function useEntranceAnimation({ delay = 0, distance = 18, duration = 420 } = {}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    opacity: progress,
    transform: [
      {
        translateY: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [distance, 0],
        }),
      },
    ],
  };
}

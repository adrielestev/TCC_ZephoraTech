import { Switch, type SwitchProps } from 'react-native';
import { colors } from './theme';

/** Interruptor nativo com as cores do Zephora (um só lugar para o estilo). */
export function AppSwitch(props: Omit<SwitchProps, 'trackColor' | 'thumbColor'>) {
  return (
    <Switch
      {...props}
      trackColor={{ false: colors.borderStrong, true: colors.primary }}
      thumbColor={colors.surface}
      // react-native-web usa esta prop para o polegar ligado
      {...({ activeThumbColor: colors.surface } as object)}
    />
  );
}

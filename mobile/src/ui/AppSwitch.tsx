// src/ui/AppSwitch.tsx -- Padroniza a aparência do controle nativo de alternância usado no app.
import { Switch, type SwitchProps } from 'react-native';
import { colors } from './theme';

export function AppSwitch(props: Omit<SwitchProps, 'trackColor' | 'thumbColor'>) {
  return (
    <Switch
      {...props}
      trackColor={{ false: colors.borderStrong, true: colors.primary }}
      thumbColor={colors.surface}
      {...({ activeThumbColor: colors.surface } as object)}
    />
  );
}

import { StyleSheet, View } from 'react-native';
import type { Automation, Device, DeviceState } from '@/core/types';
import { describeFlag, getFlag } from '@/features/devices/deviceTypes';
import { AppSwitch } from '@/ui/AppSwitch';
import { AppText } from '@/ui/AppText';
import { Badge } from '@/ui/Badge';
import { Card } from '@/ui/Card';
import { IconButton } from '@/ui/Icon';
import { IconTile } from '@/ui/ListItem';
import { colors, spacing } from '@/ui/theme';

interface Props {
  automation: Automation;
  devices: Device[];
  onPauseChange: (paused: boolean) => void;
  onManage?: () => void;
}

export function describeLink(devices: Device[], deviceId: number, state: DeviceState): string {
  const device = devices.find((d) => d.id === deviceId);
  if (!device) return 'Aparelho removido';
  return `${device.name}: ${describeFlag(device.type, getFlag(device.type, state)).toLowerCase()}`;
}

export function AutomationCard({ automation, devices, onPauseChange, onManage }: Props) {
  const active = !automation.isPaused;
  const when = automation.triggers.map((t) => describeLink(devices, t.deviceId, t.condition)).join(' e ');
  const then = automation.actions.map((a) => describeLink(devices, a.deviceId, a.state)).join(' e ');

  return (
    <Card>
      <View style={styles.row}>
        <IconTile name="flash-outline" solid={active} tone="neutral" />
        <AppText variant="bodyStrong" style={styles.title}>
          {automation.name}
        </AppText>
        <AppSwitch
          value={active}
          onValueChange={(value) => onPauseChange(!value)}
          accessibilityLabel={`Automação ${automation.name}: ${active ? 'ativa' : 'pausada'}. Toque para alternar`}
        />
        {onManage ? (
          <IconButton name="settings-outline" label={`Gerenciar automação ${automation.name}`} onPress={onManage} />
        ) : null}
      </View>

      <View style={styles.rules}>
        <View style={styles.rule}>
          <AppText variant="overline" color="textMuted" style={styles.ruleLabel}>
            Quando
          </AppText>
          <AppText variant="label" style={styles.ruleText}>
            {when}
          </AppText>
        </View>
        <View style={styles.rule}>
          <AppText variant="overline" color="textMuted" style={styles.ruleLabel}>
            Então
          </AppText>
          <AppText variant="label" style={styles.ruleText}>
            {then}
          </AppText>
        </View>
      </View>

      {!active ? <Badge label="Pausada: não vai disparar" tone="warning" icon="pause-circle-outline" /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: { flex: 1 },
  rules: { gap: spacing.sm, backgroundColor: colors.surfaceMuted, borderRadius: 10, padding: spacing.md },
  rule: { flexDirection: 'row', gap: spacing.md },
  ruleLabel: { width: 56, paddingTop: 2 },
  ruleText: { flex: 1, fontWeight: '500' },
});

import { StyleSheet, View } from 'react-native';
import type { Device } from '@/core/types';
import { AppSwitch } from '@/ui/AppSwitch';
import { AppText } from '@/ui/AppText';
import { Badge } from '@/ui/Badge';
import { Card } from '@/ui/Card';
import { IconButton } from '@/ui/Icon';
import { IconTile } from '@/ui/ListItem';
import { colors, spacing } from '@/ui/theme';
import { describeFlag, deviceTypes, effectiveFlag, getFlag, getTemperature, isApplying } from '../deviceTypes';

interface Props {
  device: Device;
  onToggle: (value: boolean) => void;
  /** admins podem gerenciar (renomear, mover, descadastrar) */
  onManage?: () => void;
}

export function DeviceCard({ device, onToggle, onManage }: Props) {
  const meta = deviceTypes[device.type];
  const offline = device.esp32Status !== 'online';
  const flag = effectiveFlag(device);
  const active = flag === true;
  const applying = isApplying(device);
  const statusText = device.type === 'temperature_sensor'
    ? (() => {
        const temperature = getTemperature(device.type, device.currentState);
        return temperature === null ? 'Sem leitura' : `${temperature.toFixed(1)} °C`;
      })()
    : device.controllable
    ? describeFlag(device.type, flag)
    : describeFlag(device.type, getFlag(device.type, device.currentState));

  return (
    <Card>
      <View style={styles.row}>
        <IconTile name={meta.icon} solid={active} tone="neutral" />
        <View style={styles.info}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {device.name}
          </AppText>
          <AppText variant="caption" color={active ? 'primaryDark' : 'textMuted'}>
            {statusText}
          </AppText>
        </View>

        {device.controllable ? (
          <AppSwitch
            value={active}
            onValueChange={onToggle}
            accessibilityLabel={`${device.name}: ${active ? 'ligada' : 'desligada'}. Toque para alternar`}
          />
        ) : null}
        {onManage ? <IconButton name="settings-outline" label={`Gerenciar ${device.name}`} onPress={onManage} /> : null}
      </View>

      {offline || applying ? (
        <View style={styles.badges}>
          {offline ? (
            <Badge
              label={device.controllable ? 'ESP32 offline · o comando fica pendente' : 'ESP32 offline'}
              tone="warning"
              icon="cloud-offline-outline"
            />
          ) : null}
          {applying ? <Badge label="Aplicando..." tone="primary" icon="sync-outline" /> : null}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  info: { flex: 1, gap: 2 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});

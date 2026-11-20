import type { Device, DeviceState, DeviceType } from '@/core/types';
import type { IconName } from '@/ui/Icon';

interface DeviceTypeMeta {
  label: string;
  icon: IconName;
  stateKey: 'on' | 'presence' | 'temperature';
  trueLabel?: string;
  falseLabel?: string;
}

/** Para suportar um novo tipo: adicione aqui (e na API em device-types.js). */
export const deviceTypes: Record<DeviceType, DeviceTypeMeta> = {
  light: {
    label: 'Luz',
    icon: 'bulb-outline',
    stateKey: 'on',
    trueLabel: 'Ligada',
    falseLabel: 'Desligada',
  },
  presence_sensor: {
    label: 'Sensor de presença',
    icon: 'walk-outline',
    stateKey: 'presence',
    trueLabel: 'Presença detectada',
    falseLabel: 'Sem presença',
  },
  temperature_sensor: {
    label: 'Sensor de temperatura',
    icon: 'thermometer-outline',
    stateKey: 'temperature',
  },
};

const unknownDeviceType: DeviceTypeMeta = {
  label: 'Aparelho',
  icon: 'hardware-chip-outline',
  stateKey: 'on',
  trueLabel: 'Ativo',
  falseLabel: 'Inativo',
};

export const getDeviceTypeMeta = (type: string): DeviceTypeMeta =>
  (deviceTypes as Record<string, DeviceTypeMeta>)[type] ?? unknownDeviceType;

export const getTemperature = (type: DeviceType, state: DeviceState | null): number | null => {
  const value = state?.[getDeviceTypeMeta(type).stateKey];
  return typeof value === 'number' ? value : null;
};

export const getFlag = (type: DeviceType, state: DeviceState | null): boolean | null => {
  const value = state?.[getDeviceTypeMeta(type).stateKey];
  return typeof value === 'boolean' ? value : null;
};

export const buildState = (type: DeviceType, value: boolean): DeviceState => ({
  [getDeviceTypeMeta(type).stateKey]: value,
});

export const describeFlag = (type: DeviceType, value: boolean | null): string => {
  if (value === null) return 'Sem leitura';
  const meta = getDeviceTypeMeta(type);
  return value ? (meta.trueLabel ?? 'Ativo') : (meta.falseLabel ?? 'Inativo');
};

/** Estado que o usuário "vê": o pedido mais recente, se houver, senão o último reportado. */
export const effectiveFlag = (device: Device): boolean | null =>
  getFlag(device.type, device.desiredState) ?? getFlag(device.type, device.currentState);

/** O ESP32 ainda não confirmou o último pedido. */
export const isApplying = (device: Device): boolean => {
  if (!device.controllable || device.desiredState === null) return false;
  return getFlag(device.type, device.desiredState) !== getFlag(device.type, device.currentState);
};

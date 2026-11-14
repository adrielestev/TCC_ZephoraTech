import type { Device, DeviceState, DeviceType } from '@/core/types';
import type { IconName } from '@/ui/Icon';

interface DeviceTypeMeta {
  label: string;
  icon: IconName;
  /** chave booleana do estado enviado/recebido pela API */
  stateKey: 'on' | 'presence';
  trueLabel: string;
  falseLabel: string;
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
};

export const getFlag = (type: DeviceType, state: DeviceState | null): boolean | null => {
  const value = state?.[deviceTypes[type].stateKey];
  return typeof value === 'boolean' ? value : null;
};

export const buildState = (type: DeviceType, value: boolean): DeviceState => ({
  [deviceTypes[type].stateKey]: value,
});

export const describeFlag = (type: DeviceType, value: boolean | null): string => {
  if (value === null) return 'Sem leitura';
  return value ? deviceTypes[type].trueLabel : deviceTypes[type].falseLabel;
};

/** Estado que o usuário "vê": o pedido mais recente, se houver, senão o último reportado. */
export const effectiveFlag = (device: Device): boolean | null =>
  getFlag(device.type, device.desiredState) ?? getFlag(device.type, device.currentState);

/** O ESP32 ainda não confirmou o último pedido. */
export const isApplying = (device: Device): boolean => {
  if (!device.controllable || device.desiredState === null) return false;
  return getFlag(device.type, device.desiredState) !== getFlag(device.type, device.currentState);
};

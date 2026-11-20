import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { getErrorMessage } from '@/core/api/errors';
import { useNumericParam } from '@/core/hooks/useNumericParam';
import type { Device } from '@/core/types';
import { routes } from '@/core/navigation/routes';
import { buildState, describeFlag, getDeviceTypeMeta } from '@/features/devices/deviceTypes';
import { useRoomDevices } from '@/features/devices/hooks';
import { AppText } from '@/ui/AppText';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { useToast } from '@/ui/Feedback';
import { IconTile } from '@/ui/ListItem';
import { Screen } from '@/ui/Screen';
import { Chip } from '@/ui/Selectors';
import { EmptyState, QueryBoundary } from '@/ui/States';
import { StepIndicator } from '@/ui/StepIndicator';
import { TextField } from '@/ui/TextField';
import { colors, spacing } from '@/ui/theme';
import { describeLink } from '../components/AutomationCard';
import { useCreateAutomation } from '../hooks';

// Fluxo 3 do fluxograma: 3 passos + etapa final "Resumo e salvar"
const STEPS = ['Nome', 'Gatilhos', 'Ações'];
const SUMMARY = STEPS.length;

/** Escolha de aparelhos com o estado desejado (ligado/desligado, presença/sem presença). */
function DevicePicker({
  devices,
  selected,
  onChange,
  emptyMessage,
}: {
  devices: Device[];
  selected: Record<number, boolean>;
  onChange: (next: Record<number, boolean>) => void;
  emptyMessage: string;
}) {
  if (devices.length === 0) return <AppText color="textMuted">{emptyMessage}</AppText>;

  return (
    <View style={{ gap: spacing.md }}>
      {devices.map((device) => {
        const meta = getDeviceTypeMeta(device.type);
        const isOn = device.id in selected;
        return (
          <Card key={device.id}>
            <View style={styles.row}>
              <IconTile name={meta.icon} size={44} solid={isOn} tone="neutral" />
              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong">{device.name}</AppText>
                <AppText variant="caption" color="textMuted">
                  {meta.label}
                </AppText>
              </View>
              <Chip
                label={isOn ? 'Incluído' : 'Incluir'}
                selected={isOn}
                onPress={() => {
                  const next = { ...selected };
                  if (isOn) delete next[device.id];
                  else next[device.id] = true;
                  onChange(next);
                }}
              />
            </View>
            {isOn ? (
              <View style={styles.options}>
                {[true, false].map((value) => (
                  <Chip
                    key={String(value)}
                    label={describeFlag(device.type, value)}
                    selected={selected[device.id] === value}
                    onPress={() => onChange({ ...selected, [device.id]: value })}
                  />
                ))}
              </View>
            ) : null}
          </Card>
        );
      })}
    </View>
  );
}

export default function NewAutomationScreen() {
  const router = useRouter();
  const toast = useToast();
  const roomId = useNumericParam('roomId');
  const devicesQuery = useRoomDevices(roomId);
  const create = useCreateAutomation(roomId);

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | undefined>();
  const [triggers, setTriggers] = useState<Record<number, boolean>>({});
  const [actions, setActions] = useState<Record<number, boolean>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const next = () => {
    setFormError(null);
    if (step === 0) {
      if (name.trim().length < 2) return setNameError('Dê um nome com ao menos 2 letras.');
      setNameError(undefined);
    }
    if (step === 1 && Object.keys(triggers).length === 0) {
      return setFormError('Escolha ao menos um sensor para disparar a automação.');
    }
    if (step === 2 && Object.keys(actions).length === 0) {
      return setFormError('Escolha ao menos um aparelho para ser controlado.');
    }
    setStep((s) => s + 1);
  };

  const save = async (devices: Device[]) => {
    setFormError(null);
    const byId = new Map(devices.map((d) => [d.id, d]));
    try {
      await create.mutateAsync({
        roomId,
        name: name.trim(),
        triggers: Object.entries(triggers).map(([id, value]) => ({
          deviceId: Number(id),
          condition: buildState((byId.get(Number(id)) as Device).type, value),
        })),
        actions: Object.entries(actions).map(([id, value]) => ({
          deviceId: Number(id),
          state: buildState((byId.get(Number(id)) as Device).type, value),
        })),
      });
      toast('Automação criada!', 'success');
      router.back();
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  };

  return (
    <QueryBoundary query={devicesQuery}>
      {(devices) => {
        const sensors = devices.filter((d) => !d.controllable);
        const controllable = devices.filter((d) => d.controllable);

        if (devices.length === 0) {
          return (
            <EmptyState
              icon="hardware-chip-outline"
              title="Cadastre aparelhos primeiro"
              message="Para criar uma automação, a sala precisa ter um sensor e um aparelho controlável."
              actionLabel="Cadastrar módulo ESP32"
              onAction={() => router.replace(routes.newEsp32)}
            />
          );
        }

        return (
          <Screen
            width="form"
            footer={
              <View style={{ gap: spacing.sm }}>
                {step < SUMMARY ? (
                  <Button label={step === 2 ? 'Revisar' : 'Continuar'} onPress={next} />
                ) : (
                  <Button
                    label="Salvar automação"
                    icon="checkmark"
                    onPress={() => save(devices)}
                    loading={create.isPending}
                  />
                )}
                {step > 0 ? (
                  <Button label="Voltar" variant="ghost" onPress={() => setStep((s) => s - 1)} />
                ) : null}
              </View>
            }
          >
            <StepIndicator steps={STEPS} current={step} doneLabel="Resumo e salvar" />
            {formError ? <Banner tone="danger" message={formError} /> : null}

            {step === 0 ? (
              <Card>
                <AppText color="textMuted">Um nome que explique o que a automação faz.</AppText>
                <TextField
                  label="Nome da automação"
                  value={name}
                  onChangeText={setName}
                  error={nameError}
                  placeholder="Ex.: Acender luz ao detectar movimento"
                  returnKeyType="next"
                  onSubmitEditing={next}
                />
              </Card>
            ) : null}

            {step === 1 ? (
              <>
                <AppText color="textMuted">
                  Quando isso acontecer... Escolha os sensores e a condição. Com mais de um, todos
                  precisam ser verdade.
                </AppText>
                <DevicePicker
                  devices={sensors}
                  selected={triggers}
                  onChange={setTriggers}
                  emptyMessage="Esta sala não tem sensores cadastrados."
                />
              </>
            ) : null}

            {step === 2 ? (
              <>
                <AppText color="textMuted">
                  ...faça isto. Escolha os aparelhos e como eles devem ficar.
                </AppText>
                <DevicePicker
                  devices={controllable}
                  selected={actions}
                  onChange={setActions}
                  emptyMessage="Esta sala não tem aparelhos controláveis cadastrados."
                />
              </>
            ) : null}

            {step === SUMMARY ? (
              <Card>
                <AppText variant="heading">{name.trim()}</AppText>
                <View style={styles.summaryRule}>
                  <AppText variant="overline" color="textMuted">
                    Quando
                  </AppText>
                  {Object.entries(triggers).map(([id, v]) => {
                    const d = devices.find((x) => x.id === Number(id)) as Device;
                    return (
                      <AppText key={id}>
                        • {describeLink(devices, d.id, buildState(d.type, v))}
                      </AppText>
                    );
                  })}
                </View>
                <View style={styles.summaryRule}>
                  <AppText variant="overline" color="textMuted">
                    Então
                  </AppText>
                  {Object.entries(actions).map(([id, v]) => {
                    const d = devices.find((x) => x.id === Number(id)) as Device;
                    return (
                      <AppText key={id}>
                        • {describeLink(devices, d.id, buildState(d.type, v))}
                      </AppText>
                    );
                  })}
                </View>
              </Card>
            ) : null}
          </Screen>
        );
      }}
    </QueryBoundary>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  summaryRule: {
    gap: spacing.xs,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    padding: spacing.md,
  },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
});

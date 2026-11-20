import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { getErrorCode, getErrorMessage } from '@/core/api/errors';
import { routes } from '@/core/navigation/routes';
import { CREDENTIAL_REGEX } from '../constants';
import { getDeviceTypeMeta } from '@/features/devices/deviceTypes';
import { RoomPicker } from '@/features/rooms/components/RoomPicker';
import { useRooms } from '@/features/rooms/hooks';
import type { Device, Room } from '@/core/types';
import { AppText } from '@/ui/AppText';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Icon } from '@/ui/Icon';
import { Screen } from '@/ui/Screen';
import { CheckRow } from '@/ui/Selectors';
import { EmptyState } from '@/ui/States';
import { StepIndicator } from '@/ui/StepIndicator';
import { TextField } from '@/ui/TextField';
import { colors, spacing } from '@/ui/theme';
import { useEsp32, useRegisterEsp32, useRegisterEsp32Devices } from '../hooks';

const STEPS = ['Credencial', 'Conexão', 'Aparelhos', 'Confirmar'];
const HELP_AFTER_MS = 60_000;

interface Choice {
  selected: boolean;
  name: string;
  roomId: number | null;
}

export default function NewEsp32Screen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const rooms = useRooms();

  const [step, setStep] = useState(params.id ? 1 : 0);
  const [esp32Id, setEsp32Id] = useState<number | null>(params.id ? Number(params.id) : null);

  // passo 1
  const [credential, setCredential] = useState('');
  const [name, setName] = useState('');
  const [credentialError, setCredentialError] = useState<string | undefined>();
  const [nameError, setNameError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const register = useRegisterEsp32();

  // passo 2
  const esp = useEsp32(esp32Id, step === 1);
  const [showHelp, setShowHelp] = useState(false);
  const [waitKey, setWaitKey] = useState(0);

  // passos 3 e 4
  const [choices, setChoices] = useState<Record<number, Choice>>({});
  const [initialized, setInitialized] = useState(false);
  const [done, setDone] = useState<{ roomId: number; count: number } | null>(null);
  const registerDevices = useRegisterEsp32Devices(esp32Id ?? 0);

  const roomList: Room[] = rooms.data ?? [];
  const discovered = (esp.data?.devices ?? []).filter((d) => d.registrationStatus === 'discovered');

  // Passo 2: quando o ESP32 fica online, segue sozinho para a escolha de aparelhos
  useEffect(() => {
    if (step === 1 && esp.data?.status === 'online') setStep(2);
  }, [step, esp.data?.status]);

  // Passo 2: depois de 60 s sem conexão, mostra a ajuda
  useEffect(() => {
    if (step !== 1) return;
    setShowHelp(false);
    const id = setTimeout(() => setShowHelp(true), HELP_AFTER_MS);
    return () => clearTimeout(id);
  }, [step, waitKey]);

  // Passo 3: começa com todos os aparelhos novos selecionados
  const initializedFor = useRef<number | null>(null);
  useEffect(() => {
    if (step !== 2 || initialized || discovered.length === 0) return;
    if (initializedFor.current === esp32Id) return;
    initializedFor.current = esp32Id;
    setChoices(
      Object.fromEntries(
        discovered.map((d) => [d.id, { selected: true, name: d.name, roomId: null }]),
      ),
    );
    setInitialized(true);
  }, [step, initialized, discovered, esp32Id]);

  const submitCredential = async () => {
    setFormError(null);
    const value = credential.trim();
    let valid = true;
    if (!CREDENTIAL_REGEX.test(value)) {
      setCredentialError(
        'A credencial tem de 32 a 128 caracteres (letras, números, - e _). Copie-a do ESP32.',
      );
      valid = false;
    } else setCredentialError(undefined);
    if (name.trim() && name.trim().length < 2) {
      setNameError('O nome deve ter ao menos 2 letras.');
      valid = false;
    } else setNameError(undefined);
    if (!valid) return;

    try {
      const created = await register.mutateAsync({
        credential: value,
        name: name.trim() || undefined,
      });
      setEsp32Id(created.id);
      setWaitKey((k) => k + 1);
      setStep(1);
    } catch (error) {
      setFormError(
        getErrorCode(error) === 'ESP32_ALREADY_REGISTERED'
          ? 'Esta credencial já está cadastrada. Confira se é o módulo certo ou abra-o na lista.'
          : getErrorMessage(error),
      );
    }
  };

  const selectedList = discovered.filter((d) => choices[d.id]?.selected);
  const setChoice = (id: number, patch: Partial<Choice>) =>
    setChoices((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } as Choice }));
  const setAllSelected = (selected: boolean) =>
    setChoices((prev) =>
      Object.fromEntries(Object.entries(prev).map(([id, c]) => [id, { ...c, selected }])),
    );
  const setRoomForSelected = (roomId: number) =>
    setChoices((prev) =>
      Object.fromEntries(
        Object.entries(prev).map(([id, c]) => [id, c.selected ? { ...c, roomId } : c]),
      ),
    );

  const goToConfirm = () => {
    setFormError(null);
    if (selectedList.length === 0)
      return setFormError('Escolha ao menos um aparelho para cadastrar.');
    if (selectedList.some((d) => !choices[d.id]?.roomId)) {
      return setFormError('Escolha a sala de cada aparelho selecionado.');
    }
    if (selectedList.some((d) => (choices[d.id]?.name.trim().length ?? 0) < 2)) {
      return setFormError('Dê um nome com ao menos 2 letras a cada aparelho.');
    }
    setStep(3);
  };

  const confirm = async () => {
    setFormError(null);
    const payload = selectedList.map((d) => ({
      deviceId: d.id,
      roomId: choices[d.id]?.roomId as number,
      name: (choices[d.id]?.name as string).trim(),
    }));
    try {
      await registerDevices.mutateAsync(payload);
      setDone({ roomId: payload[0]?.roomId as number, count: payload.length });
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  };

  const roomName = (id: number | null) => roomList.find((r) => r.id === id)?.name ?? '';

  // ---------- Conclusão ----------
  if (done) {
    return (
      <Screen width="form" centered>
        <EmptyState
          icon="checkmark-circle"
          title="Aparelhos prontos!"
          message={`${done.count} aparelho(s) cadastrado(s). Já dá para controlá-los na sala.`}
        />
        <Button
          label={`Ver a sala ${roomName(done.roomId)}`.trim()}
          onPress={() => router.replace(routes.room(done.roomId))}
        />
        <Button
          label="Voltar para os módulos"
          variant="outline"
          onPress={() => router.replace(routes.esp32List)}
        />
      </Screen>
    );
  }

  return (
    <Screen
      width="form"
      footer={
        step === 0 ? (
          <Button label="Continuar" onPress={submitCredential} loading={register.isPending} />
        ) : step === 2 ? (
          <View style={{ gap: spacing.sm }}>
            <Button
              label={`Continuar com ${selectedList.length} aparelho(s)`}
              onPress={goToConfirm}
              disabled={discovered.length === 0}
            />
          </View>
        ) : step === 3 ? (
          <View style={{ gap: spacing.sm }}>
            <Button
              label={`Cadastrar ${selectedList.length} aparelho(s)`}
              onPress={confirm}
              loading={registerDevices.isPending}
            />
            <Button label="Voltar" variant="ghost" onPress={() => setStep(2)} />
          </View>
        ) : undefined
      }
    >
      <StepIndicator steps={STEPS} current={step} />
      {formError ? <Banner tone="danger" message={formError} /> : null}

      {/* PASSO 1: credencial */}
      {step === 0 ? (
        <>
          <AppText color="textMuted">
            Cada ESP32 tem uma credencial única. Ligue o módulo, copie a credencial exibida por ele
            e cole abaixo.
          </AppText>
          <TextField
            label="Credencial do ESP32"
            value={credential}
            onChangeText={setCredential}
            error={credentialError}
            hint="32 a 128 caracteres: letras, números, - e _."
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            placeholder="Cole a credencial aqui"
          />
          <TextField
            label="Nome do módulo (opcional)"
            value={name}
            onChangeText={setName}
            error={nameError}
            placeholder="Ex.: ESP da Sala 101"
          />
        </>
      ) : null}

      {/* PASSO 2: aguardando conexão */}
      {step === 1 ? (
        <>
          <Card>
            <View style={styles.waiting}>
              <ActivityIndicator size="large" color={colors.primary} />
              <AppText variant="heading" center>
                Aguardando o ESP32 se conectar...
              </AppText>
              <AppText color="textMuted" center>
                Mantenha o módulo ligado e perto do Wi-Fi. Esta tela avança sozinha quando ele
                responder.
              </AppText>
            </View>
          </Card>
          {showHelp ? (
            <Card>
              <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
                <Icon name="help-buoy-outline" size={22} color="warning" />
                <AppText variant="heading">Ainda não conectou?</AppText>
              </View>
              <AppText color="textMuted">
                • Confirme que o ESP32 está ligado e conectado ao Wi-Fi.
              </AppText>
              <AppText color="textMuted">
                • Confira se a credencial no ESP32 é igual à que você informou.
              </AppText>
              <AppText color="textMuted">
                • Verifique se o endereço da API configurado no ESP32 está correto.
              </AppText>
              <Button
                label="Tentar de novo"
                variant="outline"
                onPress={() => {
                  setWaitKey((k) => k + 1);
                  void esp.refetch();
                }}
              />
            </Card>
          ) : null}
          <Button
            label="Continuar depois"
            variant="ghost"
            onPress={() => router.replace(routes.esp32List)}
          />
        </>
      ) : null}

      {/* PASSO 3: escolher aparelhos */}
      {step === 2 ? (
        discovered.length === 0 ? (
          <>
            <EmptyState
              icon="search-outline"
              title="Nenhum aparelho reportado ainda"
              message="O módulo está online, mas ainda não enviou a lista de aparelhos. Aguarde alguns segundos e atualize."
              actionLabel="Atualizar"
              onAction={() => void esp.refetch()}
            />
          </>
        ) : (
          <>
            <AppText color="textMuted">
              O ESP32 reportou estes aparelhos. Escolha quais cadastrar, o nome e a sala de cada um.
            </AppText>
            <View style={styles.bulk}>
              <Button
                label="Selecionar todos"
                variant="secondary"
                fullWidth={false}
                onPress={() => setAllSelected(true)}
              />
              <Button
                label="Limpar seleção"
                variant="ghost"
                fullWidth={false}
                onPress={() => setAllSelected(false)}
              />
            </View>

            <Card>
              <AppText variant="label">Sala para todos os selecionados</AppText>
              <RoomPicker rooms={roomList} value={null} onChange={setRoomForSelected} />
              <AppText variant="caption" color="textMuted">
                Atalho: define a sala dos selecionados de uma vez. Você ainda pode ajustar cada um.
              </AppText>
            </Card>

            {discovered.map((device) => (
              <DeviceChoiceCard
                key={device.id}
                device={device}
                choice={choices[device.id]}
                rooms={roomList}
                onChange={(patch) => setChoice(device.id, patch)}
              />
            ))}
          </>
        )
      ) : null}

      {/* PASSO 4: confirmar */}
      {step === 3 ? (
        <>
          <AppText color="textMuted">Confira antes de cadastrar:</AppText>
          {selectedList.map((d) => (
            <Card key={d.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <Icon name={getDeviceTypeMeta(d.type).icon} size={24} color="primary" />
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyStrong">{choices[d.id]?.name}</AppText>
                  <AppText variant="caption" color="textMuted">
                    {getDeviceTypeMeta(d.type).label} · sala{' '}
                    {roomName(choices[d.id]?.roomId ?? null)}
                  </AppText>
                </View>
              </View>
            </Card>
          ))}
        </>
      ) : null}
    </Screen>
  );
}

function DeviceChoiceCard({
  device,
  choice,
  rooms,
  onChange,
}: {
  device: Device;
  choice: Choice | undefined;
  rooms: Room[];
  onChange: (patch: Partial<Choice>) => void;
}) {
  const meta = getDeviceTypeMeta(device.type);
  if (!choice) return null;
  return (
    <Card>
      <CheckRow
        label={device.name}
        sublabel={`${meta.label} · canal ${device.channel}`}
        checked={choice.selected}
        onToggle={() => onChange({ selected: !choice.selected })}
      />
      {choice.selected ? (
        <View style={{ gap: spacing.md }}>
          <TextField
            label="Nome"
            value={choice.name}
            onChangeText={(text) => onChange({ name: text })}
          />
          <AppText variant="label">Sala</AppText>
          <RoomPicker
            rooms={rooms}
            value={choice.roomId}
            onChange={(roomId) => onChange({ roomId })}
          />
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  waiting: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
  bulk: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
});

import { useCallback, useEffect, useState } from "react";
import { ConfigEntry, configEntriesFromObject, DeviceConfigEntriesEditor } from "@/features/devices/components/DeviceConfigEntriesEditor";
import { DeviceChoice as Choice } from "@/features/devices/components/DeviceChoice";
import { Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { DeviceDirection, DeviceStateLabels, DeviceType } from "@/types";
import { useCreateDevice, useDevice, useRoomDevices, useUpdateDevice } from "@/hooks/useDevices";
import { deviceTypesByDirection, deviceTypeLabels, defaultDeviceLabels } from "@/utils/deviceRules";
import { FormField } from "@/components/FormField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { SurfaceCard } from "@/components/SurfaceCard";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { colors, layout, radii, spacing, typography } from "@/theme/tokens";
import { useAuth } from "@/context/AuthContext";

export default function DeviceEditScreen() {
  const { id, deviceId: deviceIdParam } = useLocalSearchParams<{ id: string; deviceId?: string }>();
  const roomId = Number(id);
  const { isAdmin } = useAuth();
  const deviceId = Number(deviceIdParam);
  const isEditing = Number.isInteger(deviceId) && deviceId > 0;
  const { data: device, isLoading, isError, refetch } = useDevice(roomId, isEditing ? deviceId : 0);
  const { data: roomDevices = [] } = useRoomDevices(roomId);
  const create = useCreateDevice(roomId);
  const update = useUpdateDevice(roomId, deviceId);
  const [name, setName] = useState("");
  const [direction, setDirection] = useState<DeviceDirection>("output");
  const [type, setType] = useState<DeviceType>("relay");
  const [pin, setPin] = useState("");
  const [unit, setUnit] = useState("");
  const [configEntries, setConfigEntries] = useState<ConfigEntry[]>([]);
  const [activeLabel, setActiveLabel] = useState(defaultDeviceLabels.relay.active);
  const [inactiveLabel, setInactiveLabel] = useState(defaultDeviceLabels.relay.inactive);
  const [error, setError] = useState<string | null>(null);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const setLabelsForType = useCallback((nextType: DeviceType) => {
    setActiveLabel(defaultDeviceLabels[nextType].active);
    setInactiveLabel(defaultDeviceLabels[nextType].inactive);
  }, []);

  useEffect(() => {
    if (!device) return;
    setName(device.name);
    setDirection(device.direction);
    setType(device.type);
    setPin(device.pin == null ? "" : String(device.pin));
    setUnit(device.value_unit ?? "");
    setConfigEntries(configEntriesFromObject(device.config));
    const defaults = defaultDeviceLabels[device.type];
    setActiveLabel(device.state_labels?.active ?? defaults.active);
    setInactiveLabel(device.state_labels?.inactive ?? defaults.inactive);
  }, [device]);

  useEffect(() => {
    if (!deviceTypesByDirection[direction].includes(type)) {
      const nextType = deviceTypesByDirection[direction][0];
      setType(nextType);
      setLabelsForType(nextType);
      setUnit(nextType === "temperature" ? "°C" : "");
    }
  }, [direction, setLabelsForType, type]);

  useEffect(() => {
    if (!isAdmin) router.replace(`/(app)/rooms/${roomId}/devices` as never);
  }, [isAdmin, roomId]);

  function chooseType(nextType: DeviceType) {
    setType(nextType);
    setLabelsForType(nextType);
    setUnit(nextType === "temperature" ? "°C" : "");
    setError(null);
  }

  function buildConfig() {
    const config: Record<string, unknown> = {};
    for (const entry of configEntries) {
      const key = entry.key.trim();
      if (!key) throw new Error("Dê um nome para cada parâmetro da configuração.");
      if (Object.hasOwn(config, key)) throw new Error(`O parâmetro “${key}” está repetido.`);
      if (entry.kind === "number") {
        const number = Number(entry.value.replace(",", "."));
        if (!entry.value.trim() || !Number.isFinite(number))
          throw new Error(`Informe um número válido para “${key}”.`);
        config[key] = number;
      } else if (entry.kind === "boolean") {
        config[key] = entry.value === "true";
      } else if (entry.kind === "json") {
        try {
          config[key] = JSON.parse(entry.value);
        } catch {
          throw new Error(`O valor JSON de “${key}” não é válido.`);
        }
      } else {
        config[key] = entry.value;
      }
    }
    return config;
  }

  async function handleSave() {
    setAttemptedSubmit(true);
    setError(null);
    if (!name.trim() || name.trim().length > 100) {
      setError("Informe um nome de até 100 caracteres.");
      return;
    }
    const parsedPin = Number(pin.trim());
    if (!pin.trim() || !Number.isInteger(parsedPin) || parsedPin < 0 || parsedPin > 48) {
      setError("Informe um GPIO inteiro entre 0 e 48.");
      return;
    }
    const pinOwner = roomDevices.find((item) => item.pin === parsedPin && item.id !== deviceId);
    if (pinOwner) {
      setError(`O GPIO ${parsedPin} já está sendo usado por “${pinOwner.name}” nesta sala.`);
      return;
    }

    let config: Record<string, unknown>;
    try {
      config = buildConfig();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Revise a configuração do dispositivo.");
      return;
    }

    if (type !== "temperature" && (!activeLabel.trim() || !inactiveLabel.trim())) {
      setError("Preencha os dois rótulos de estado.");
      return;
    }

    const stateLabels: DeviceStateLabels =
      type === "temperature" ? {} : { active: activeLabel.trim(), inactive: inactiveLabel.trim() };
    const payload = {
      name: name.trim(),
      direction,
      type,
      pin: parsedPin,
      config_json: config,
      state_labels_json: stateLabels,
      value_unit: type === "temperature" ? unit.trim() || "°C" : null,
    };
    try {
      if (isEditing) await update.mutateAsync(payload);
      else await create.mutateAsync({ ...payload, current_state: 0 });
      router.back();
    } catch {
      setError("Não foi possível salvar. Confira o GPIO e os parâmetros configurados.");
    }
  }

  if (!isAdmin) return null;
  if (isEditing && isLoading) return <LoadingState label="Carregando dispositivo..." />;
  if (isEditing && (isError || !device))
    return (
      <ErrorState message="Não foi possível carregar o dispositivo." onRetry={() => refetch()} />
    );

  return (
    <Screen contentContainerStyle={{ gap: spacing.md }}>
      <SurfaceCard>
        <Text style={{ ...typography.title, color: colors.ink, textAlign: "center" }}>
          {isEditing ? "Editar dispositivo" : "Novo dispositivo"}
        </Text>
        <FormField
          label="Nome *"
          placeholder="Ex.: Iluminação principal"
          value={name}
          onChangeText={setName}
          maxLength={100}
          helperText="Nome exibido na sala. Use até 100 caracteres."
          error={attemptedSubmit && !name.trim() ? "Este campo é obrigatório." : undefined}
        />
        <Text style={{ ...typography.label, color: colors.text }}>Direção</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
          <Choice
            label="Saída controlável"
            selected={direction === "output"}
            disabled={isEditing}
            onPress={() => setDirection("output")}
          />
          <Choice
            label="Entrada de leitura"
            selected={direction === "input"}
            disabled={isEditing}
            onPress={() => setDirection("input")}
          />
        </View>
        {isEditing && (
          <Text style={{ ...typography.caption, color: colors.muted }}>
            A direção não pode ser alterada após a criação do dispositivo.
          </Text>
        )}
        <Text style={{ ...typography.label, color: colors.text }}>Tipo de dispositivo</Text>
        <Text style={{ ...typography.caption, color: colors.muted }}>
          Escolha o tipo físico para definir os estados e controles disponíveis.
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
          {deviceTypesByDirection[direction].map((item) => (
            <Choice
              key={item}
              label={deviceTypeLabels[item]}
              selected={type === item}
              onPress={() => chooseType(item)}
            />
          ))}
        </View>

        <FormField
          label="Pino GPIO *"
          placeholder="Ex.: 5"
          value={pin}
          onChangeText={setPin}
          keyboardType="number-pad"
          helperText="Obrigatório. Informe um GPIO entre 0 e 48 que corresponda ao ESP32."
          error={
            attemptedSubmit &&
            (!pin.trim() || !Number.isInteger(Number(pin)) || Number(pin) < 0 || Number(pin) > 48)
              ? "Informe um GPIO inteiro entre 0 e 48."
              : attemptedSubmit &&
                  roomDevices.some((item) => item.pin === Number(pin) && item.id !== deviceId)
                ? "Este GPIO já está em uso nesta sala."
                : undefined
          }
        />

        {type === "temperature" && (
          <FormField
            label="Unidade da leitura"
            placeholder="°C"
            value={unit}
            onChangeText={setUnit}
            maxLength={20}
            helperText="A temperatura é registrada em Celsius; se deixar em branco, usaremos °C."
          />
        )}

        {type !== "temperature" && (
          <View style={{ gap: spacing.sm }}>
            <Text style={{ ...typography.label, color: colors.text }}>Rótulos de estado</Text>
            <Text style={{ ...typography.caption, color: colors.muted }}>
              Personalize os textos exibidos quando o dispositivo estiver ativo ou inativo.
            </Text>
            <FormField
              label="Ativo"
              placeholder={defaultDeviceLabels[type].active}
              value={activeLabel}
              onChangeText={setActiveLabel}
              helperText="Texto exibido quando o dispositivo estiver ativo."
              error={
                attemptedSubmit && !activeLabel.trim() ? "Este rótulo é obrigatório." : undefined
              }
            />
            <FormField
              label="Inativo"
              placeholder={defaultDeviceLabels[type].inactive}
              value={inactiveLabel}
              onChangeText={setInactiveLabel}
              helperText="Texto exibido quando o dispositivo estiver inativo."
              error={
                attemptedSubmit && !inactiveLabel.trim() ? "Este rótulo é obrigatório." : undefined
              }
            />
          </View>
        )}

        <DeviceConfigEntriesEditor entries={configEntries} onChange={setConfigEntries} attemptedSubmit={attemptedSubmit} />
        {type === "presence" && (
          <Text style={{ ...typography.caption, color: colors.muted }}>
            No sensor de presença, adicione hold_ms como parâmetro numérico para manter a detecção ativa após o movimento parar (ex.: 30000 = 30 s). Esse tempo começa após a ausência passar pelo debounce_ms. Ambos aceitam até 300000 ms.
          </Text>
        )}

        {error && (
          <Text accessibilityRole="alert" style={{ color: colors.error, fontWeight: "600" }}>
            {error}
          </Text>
        )}
        <PrimaryButton
          label={isEditing ? "Salvar alterações" : "Criar dispositivo"}
          onPress={handleSave}
          loading={create.isPending || update.isPending}
        />
      </SurfaceCard>
    </Screen>
  );
}

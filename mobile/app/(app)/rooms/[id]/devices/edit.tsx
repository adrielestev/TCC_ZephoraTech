import { useEffect, useState, type ReactNode } from "react";
import { View, Text, Pressable, ActivityIndicator, Switch } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useCreateSensor, useSensor, useUpdateSensor } from "../../../../../src/hooks/useSensors";
import { SensorControlType, SensorDirection, SensorType } from "../../../../../src/types";
import type { SensorStateLabels } from "../../../../../src/types";
import { FormField } from "../../../../../src/components/FormField";
import { PrimaryButton } from "../../../../../src/components/PrimaryButton";
import { Screen } from "../../../../../src/components/Screen";
import { SurfaceCard } from "../../../../../src/components/SurfaceCard";
import { colors, layout, radii, spacing, typography } from "../../../../../src/theme/tokens";
import {
  getDefaultDeviceSettings,
  getDefaultDeviceStateLabels,
  getSensorRule,
  isValidSensorConfiguration,
  sensorTypeLabels,
  sensorTypeOptions,
} from "../../../../../src/utils/sensorRules";
import { FeedbackMessage } from "../../../../../src/components/FeedbackMessage";
import { IconButton } from "../../../../../src/components/IconButton";

type SettingValues = Record<string, string | number | boolean>;

function NumberSetting({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | number | boolean | undefined;
  onChange: (value: string) => void;
}) {
  return (
    <FormField
      label={label}
      value={String(value ?? "")}
      onChangeText={onChange}
      keyboardType="number-pad"
    />
  );
}

function SettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View
      style={{
        gap: spacing.sm,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      }}
    >
      <Text style={{ ...typography.section, color: colors.ink }}>{title}</Text>
      {children}
    </View>
  );
}

export default function SensorEditScreen() {
  const { id, sensorId } = useLocalSearchParams<{ id: string; sensorId?: string }>();
  const roomId = Number(id);
  const parsedSensorId = Number(sensorId);
  const isEditing = Number.isInteger(parsedSensorId) && parsedSensorId > 0;
  const { data: sensor, isLoading, isError, refetch } = useSensor(isEditing ? parsedSensorId : 0);
  const createSensor = useCreateSensor();
  const updateSensor = useUpdateSensor(roomId);

  const [name, setName] = useState("");
  const [deviceKey, setDeviceKey] = useState("");
  const [direction, setDirection] = useState<SensorDirection>("OUTPUT");
  const [type, setType] = useState<SensorType>("RELE");
  const [control, setControl] = useState<SensorControlType>("DIGITAL");
  const [pin, setPin] = useState("");
  const [settings, setSettings] = useState<SettingValues>(getDefaultDeviceSettings("RELE"));
  const [stateLabels, setStateLabels] = useState<SensorStateLabels>(
    getDefaultDeviceStateLabels("RELE"),
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sensor) return;
    setName(sensor.name);
    setDeviceKey(sensor.device_key);
    setDirection(sensor.direction);
    setType(sensor.type);
    setControl(sensor.type_of_control);
    setPin(String(sensor.pin));
    setSettings({ ...getDefaultDeviceSettings(sensor.type), ...sensor.device_settings });
    setStateLabels({ ...getDefaultDeviceStateLabels(sensor.type), ...sensor.state_labels });
  }, [sensor]);

  if (isEditing && isLoading) return <ActivityIndicator style={{ flex: 1 }} />;

  if (isEditing && isError) {
    return (
      <Screen contentContainerStyle={{ gap: 12, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 18, fontWeight: "600" }}>
          Não foi possível carregar o dispositivo.
        </Text>
        <PrimaryButton label="Tentar novamente" onPress={() => refetch()} />
      </Screen>
    );
  }

  function updateSetting(key: string, value: string | number | boolean) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function handleSave() {
    const parsedPin = Number(pin);
    const normalizedDeviceKey = deviceKey.trim().toLowerCase();
    if (
      !name.trim() ||
      !/^[a-z0-9_]+$/.test(normalizedDeviceKey) ||
      !Number.isInteger(parsedPin) ||
      parsedPin < 0 ||
      parsedPin > 39
    ) {
      setError("Informe nome, uma chave com letras minúsculas/números/_ e um pino entre 0 e 39.");
      return;
    }
    if (!isValidSensorConfiguration(type, direction, control)) {
      setError("O tipo selecionado exige uma direção e um modo de controle específicos.");
      return;
    }
    if (!stateLabels.active.trim() || !stateLabels.inactive.trim()) {
      setError("Informe os rótulos para os estados ativo e inativo.");
      return;
    }

    const numericSettings: SettingValues = Object.fromEntries(
      Object.entries(settings).map(([key, value]) => [
        key,
        typeof value === "string" ? Number(value) : value,
      ]),
    );
    if (type === "PWM" || type === "SERVO") {
      const minimum = Number(numericSettings.min_percent);
      const maximum = Number(numericSettings.max_percent);
      const step = Number(numericSettings.step_percent);
      if (
        !Number.isInteger(minimum) ||
        minimum < 0 ||
        minimum > 100 ||
        !Number.isInteger(maximum) ||
        maximum < minimum ||
        maximum > 100 ||
        !Number.isInteger(step) ||
        step < 1 ||
        step > 100
      ) {
        setError("Configure uma faixa percentual válida e um passo entre 1 e 100.");
        return;
      }
    }
    if (type === "SERVO") {
      const minimum = Number(numericSettings.min_angle);
      const maximum = Number(numericSettings.max_angle);
      if (
        !Number.isInteger(minimum) ||
        !Number.isInteger(maximum) ||
        minimum < 0 ||
        maximum > 180 ||
        minimum >= maximum
      ) {
        setError("Informe ângulos entre 0 e 180, com mínimo menor que o máximo.");
        return;
      }
    }

    setError(null);
    try {
      const payload = {
        name: name.trim(),
        device_key: normalizedDeviceKey,
        direction,
        type,
        type_of_control: control,
        pin: parsedPin,
        device_settings: numericSettings,
        state_labels: {
          active: stateLabels.active.trim(),
          inactive: stateLabels.inactive.trim(),
        },
      };
      if (isEditing) {
        await updateSensor.mutateAsync({ sensorId: parsedSensorId, data: payload });
      } else {
        await createSensor.mutateAsync({ room_id: roomId, ...payload, current_state: 0 });
      }
      router.back();
    } catch {
      setError("Não foi possível salvar. Confira os limites e as configurações do dispositivo.");
    }
  }

  const pending = createSensor.isPending || updateSensor.isPending;
  return (
    <Screen
      contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xl }}
    >
      <SurfaceCard>
        <Text style={{ ...typography.title, color: colors.ink }}>
          {isEditing ? "Editar dispositivo" : "Novo dispositivo"}
        </Text>
        <Text style={{ ...typography.body, color: colors.muted }}>
          Defina a identificação, o tipo e o pino usado para conectar este dispositivo.
        </Text>
      </SurfaceCard>

      <SurfaceCard>
        <View style={{ gap: spacing.xs }}>
          <Text style={{ ...typography.section, color: colors.ink }}>Identificação</Text>
          <Text style={{ ...typography.caption, color: colors.muted }}>
            Nome exibido no app e chave usada na comunicação com o ESP32.
          </Text>
        </View>
        <FormField
          label="Nome"
          placeholder="Nome do dispositivo"
          value={name}
          onChangeText={setName}
        />
        <FormField
          label="Chave do dispositivo"
          placeholder="lampada"
          value={deviceKey}
          onChangeText={setDeviceKey}
          autoCapitalize="none"
        />
      </SurfaceCard>

      <SurfaceCard>
        <View style={{ gap: spacing.xs }}>
          <Text style={{ ...typography.section, color: colors.ink }}>Tipo e conexão</Text>
          <Text style={{ ...typography.caption, color: colors.muted }}>
            O tipo define se o dispositivo será controlado ou apenas fará leituras.
          </Text>
        </View>
        <FormField
          label={type === "PWM" ? "GPIO de saída PWM" : "Pino GPIO"}
          placeholder="12"
          value={pin}
          onChangeText={setPin}
          keyboardType="number-pad"
        />
        <Text style={{ ...typography.label, color: colors.text }}>Tipo de dispositivo</Text>
        <View
          accessible
          accessibilityRole="radiogroup"
          accessibilityLabel="Tipo de dispositivo"
          style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}
        >
          {sensorTypeOptions.map((value) => (
            <Pressable
              key={value}
              onPress={() => {
                const rule = getSensorRule(value);
                setType(value);
                setDirection(rule.direction);
                setControl(rule.control);
                setSettings(getDefaultDeviceSettings(value));
                setStateLabels(getDefaultDeviceStateLabels(value));
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: type === value }}
              style={({ pressed }) => ({
                minHeight: layout.minTouchTarget,
                paddingHorizontal: spacing.md,
                justifyContent: "center",
                borderWidth: 1,
                borderRadius: radii.button,
                borderColor: type === value ? colors.primary : colors.border,
                backgroundColor: type === value ? colors.primarySoft : colors.surfaceMuted,
                opacity: pressed ? 0.78 : 1,
              })}
            >
              <Text
                style={{
                  ...typography.caption,
                  color: type === value ? colors.primary : colors.text,
                }}
              >
                {sensorTypeLabels[value]}
              </Text>
            </Pressable>
          ))}
        </View>
        <View
          style={{
            alignSelf: "flex-start",
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
            borderRadius: radii.pill,
            backgroundColor: colors.surfaceAccent,
          }}
        >
          <Text style={{ ...typography.caption, color: colors.primary }}>
            {direction === "INPUT" ? "Entrada" : "Saída"} ·{" "}
            {control === "ANALOGICO" ? "Analógico" : "Digital"}
          </Text>
        </View>
      </SurfaceCard>

      <SurfaceCard>
        <View style={{ gap: spacing.sm }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ ...typography.section, color: colors.ink, flex: 1 }}>
              Configurações avançadas
            </Text>
            <IconButton
              icon={showAdvanced ? "eye-off-outline" : "eye-outline"}
              label={
                showAdvanced
                  ? "Ocultar configurações avançadas"
                  : "Visualizar configurações avançadas"
              }
              onPress={() => setShowAdvanced((visible) => !visible)}
            />
          </View>
          {showAdvanced && (
            <View style={{ gap: spacing.md }}>
              {type === "TEMPERATURE" ? (
                <SettingsGroup title="Leitura de temperatura">
                  <Text style={{ ...typography.caption, color: colors.muted }}>
                    Valores em °C, entre −40 e 125 graus.
                  </Text>
                </SettingsGroup>
              ) : (
                <SettingsGroup title="Rótulos amigáveis">
                  <Text style={{ ...typography.caption, color: colors.muted }}>
                    Escolha os textos exibidos para cada estado.
                  </Text>
                  <FormField
                    label="Quando ativo"
                    placeholder={getDefaultDeviceStateLabels(type).active}
                    value={stateLabels.active}
                    onChangeText={(active) => setStateLabels((current) => ({ ...current, active }))}
                    maxLength={40}
                  />
                  <FormField
                    label="Quando inativo"
                    placeholder={getDefaultDeviceStateLabels(type).inactive}
                    value={stateLabels.inactive}
                    onChangeText={(inactive) =>
                      setStateLabels((current) => ({ ...current, inactive }))
                    }
                    maxLength={40}
                  />
                </SettingsGroup>
              )}
              {"inverted" in settings && (
                <SettingsGroup title="Sinal elétrico">
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text
                      style={{
                        ...typography.body,
                        color: colors.text,
                        flex: 1,
                        paddingRight: spacing.md,
                      }}
                    >
                      {type === "PWM"
                        ? "Inverter saída PWM (100% − valor configurado)"
                        : "Módulo ativo em nível baixo"}
                    </Text>
                    <Switch
                      value={Boolean(settings.inverted)}
                      onValueChange={(value) => updateSetting("inverted", value)}
                    />
                  </View>
                </SettingsGroup>
              )}
              {(type === "PWM" || type === "SERVO") && (
                <SettingsGroup title="Faixa e controle">
                  <NumberSetting
                    label="Percentual mínimo"
                    value={settings.min_percent}
                    onChange={(value) => updateSetting("min_percent", value)}
                  />
                  <NumberSetting
                    label="Percentual máximo"
                    value={settings.max_percent}
                    onChange={(value) => updateSetting("max_percent", value)}
                  />
                  <NumberSetting
                    label="Passo do controle (%)"
                    value={settings.step_percent}
                    onChange={(value) => updateSetting("step_percent", value)}
                  />
                  {type === "PWM" && (
                    <NumberSetting
                      label="Frequência PWM (Hz)"
                      value={settings.frequency_hz}
                      onChange={(value) => updateSetting("frequency_hz", value)}
                    />
                  )}
                  {type === "SERVO" && (
                    <>
                      <NumberSetting
                        label="Ângulo mínimo (graus)"
                        value={settings.min_angle}
                        onChange={(value) => updateSetting("min_angle", value)}
                      />
                      <NumberSetting
                        label="Ângulo máximo (graus)"
                        value={settings.max_angle}
                        onChange={(value) => updateSetting("max_angle", value)}
                      />
                    </>
                  )}
                </SettingsGroup>
              )}
              {["REED_SWITCH", "CONTACT_SENSOR", "PIR_SENSOR"].includes(type) && (
                <SettingsGroup title="Temporização">
                  <NumberSetting
                    label="Debounce (ms)"
                    value={settings.debounce_ms}
                    onChange={(value) => updateSetting("debounce_ms", value)}
                  />
                  {type === "PIR_SENSOR" && (
                    <NumberSetting
                      label="Retenção da presença (ms)"
                      value={settings.hold_ms}
                      onChange={(value) => updateSetting("hold_ms", value)}
                    />
                  )}
                </SettingsGroup>
              )}
            </View>
          )}
        </View>
      </SurfaceCard>

      <SurfaceCard>
        {error && <FeedbackMessage message={error} />}
        <PrimaryButton
          label={isEditing ? "Salvar alterações" : "Adicionar dispositivo"}
          onPress={handleSave}
          loading={pending}
        />
      </SurfaceCard>
    </Screen>
  );
}

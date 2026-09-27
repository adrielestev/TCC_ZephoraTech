import { useEffect, useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useCreateSensor, useSensor, useUpdateSensor } from "../../../../../src/hooks/useSensors";
import { SensorControlType, SensorDirection, SensorType } from "../../../../../src/types";
import { FormField } from "../../../../../src/components/FormField";
import { PrimaryButton } from "../../../../../src/components/PrimaryButton";
import { Screen } from "../../../../../src/components/Screen";
import { SurfaceCard } from "../../../../../src/components/SurfaceCard";
import { colors, spacing } from "../../../../../src/theme/tokens";
import { getSensorRule, isValidSensorConfiguration } from "../../../../../src/utils/sensorRules";

const sensorTypes: SensorType[] = ["RELE", "SERVO", "PWM", "REED_SWITCH"];

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
  const [pinPwm, setPinPwm] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sensor) return;
    setName(sensor.name);
    setDeviceKey(sensor.device_key);
    setDirection(sensor.direction);
    setType(sensor.type);
    setControl(sensor.type_of_control);
    setPin(String(sensor.pin));
    setPinPwm(sensor.pin_pwm == null ? "" : String(sensor.pin_pwm));
  }, [sensor]);

  if (isEditing && isLoading) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

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

  async function handleSave() {
    const parsedPin = Number(pin);
    const parsedPinPwm = pinPwm.trim() ? Number(pinPwm) : null;
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
    if (
      parsedPinPwm !== null &&
      (!Number.isInteger(parsedPinPwm) || parsedPinPwm < 0 || parsedPinPwm > 39)
    ) {
      setError("O pino PWM deve estar entre 0 e 39.");
      return;
    }
    if (!isValidSensorConfiguration(type, direction, control)) {
      setError("O tipo selecionado exige uma direção e um modo de controle específicos.");
      return;
    }
    if (!getSensorRule(type).usesPwmPin && parsedPinPwm !== null) {
      setError("Este tipo de dispositivo não utiliza pino PWM.");
      return;
    }

    setError(null);
    try {
      if (isEditing) {
        await updateSensor.mutateAsync({
          sensorId: parsedSensorId,
          data: {
            name: name.trim(),
            device_key: normalizedDeviceKey,
            direction,
            type,
            type_of_control: control,
            pin: parsedPin,
            pin_pwm: parsedPinPwm,
          },
        });
      } else {
        await createSensor.mutateAsync({
          room_id: roomId,
          name: name.trim(),
          device_key: normalizedDeviceKey,
          direction,
          type,
          type_of_control: control,
          pin: parsedPin,
          pin_pwm: parsedPinPwm,
          current_state: 0,
        });
      }
      router.back();
    } catch {
      setError("Não foi possível salvar o dispositivo. Confira os dados.");
    }
  }

  const pending = createSensor.isPending || updateSensor.isPending;

  return (
    <Screen contentContainerStyle={{ justifyContent: "center", gap: spacing.lg }}>
      <SurfaceCard>
        <Text style={{ fontSize: 26, fontWeight: "800", color: colors.ink, textAlign: "center" }}>
          {isEditing ? "Editar dispositivo" : "Novo dispositivo"}
        </Text>
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
        <FormField
          label="Pino"
          placeholder="12"
          value={pin}
          onChangeText={setPin}
          keyboardType="number-pad"
        />
        {getSensorRule(type).usesPwmPin && (
          <FormField
            label="Pino PWM"
            placeholder="13"
            value={pinPwm}
            onChangeText={setPinPwm}
            keyboardType="number-pad"
          />
        )}
        <Text>Tipo</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {sensorTypes.map((value) => (
            <Pressable
              key={value}
              onPress={() => {
                const rule = getSensorRule(value);
                setType(value);
                setDirection(rule.direction);
                setControl(rule.control);
                if (!rule.usesPwmPin) setPinPwm("");
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: type === value }}
              style={{
                borderWidth: 1,
                borderRadius: 8,
                padding: 10,
                backgroundColor: type === value ? "#DCEEFF" : "transparent",
              }}
            >
              <Text>{value}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={{ color: colors.muted }}>
          Configuração: {direction} · {control}
          {getSensorRule(type).usesPwmPin ? " · PWM" : ""}
        </Text>
        {error && (
          <Text accessibilityRole="alert" style={{ color: colors.error, fontWeight: "600" }}>
            {error}
          </Text>
        )}
        <PrimaryButton label="Salvar" onPress={handleSave} loading={pending} />
      </SurfaceCard>
    </Screen>
  );
}

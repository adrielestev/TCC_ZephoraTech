import { Pressable, Text, View } from "react-native";
import { AutomationOperator, Device } from "@/types";
import { FormField } from "@/components/FormField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SurfaceCard } from "@/components/SurfaceCard";
import { colors, layout, spacing, typography } from "@/theme/tokens";
import { AutomationDeviceChoices } from "./AutomationDeviceChoices";

const operatorLabels: Record<AutomationOperator, string> = {
  eq: "igual a",
  ne: "diferente de",
  gt: "maior que",
  gte: "maior ou igual a",
  lt: "menor que",
  lte: "menor ou igual a",
};
const numericOperators: AutomationOperator[] = ["eq", "ne", "gt", "gte", "lt", "lte"];
const binaryOperators: AutomationOperator[] = ["eq", "ne"];

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: layout.minTouchTarget,
        justifyContent: "center",
        paddingHorizontal: spacing.md,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? colors.primarySoft : colors.surface,
        opacity: pressed ? 0.72 : 1,
      })}
    >
      <Text style={{ ...typography.caption, color: selected ? colors.primary : colors.text }}>{label}</Text>
    </Pressable>
  );
}

function formatValue(device: Device | undefined, value: number) {
  if (!device) return String(value);
  if (device.type === "temperature") return `${value} ${device.value_unit || "°C"}`;
  if (device.type === "pwm") return `${value}%`;
  if (device.type === "presence") return value > 0 ? "presença detectada" : "sem presença";
  if (device.type === "contact") return value > 0 ? "aberto" : "fechado";
  return value > 0 ? "ligado" : "desligado";
}

export interface AutomationFormProps {
  editing: boolean;
  inputDevices: Device[];
  outputDevices: Device[];
  sourceId: number;
  onSourceChange: (device: Device) => void;
  operator: AutomationOperator;
  onOperatorChange: (operator: AutomationOperator) => void;
  comparisonValue: string;
  onComparisonValueChange: (value: string) => void;
  targetId: number;
  targetValue: string;
  onTargetSelect: (device: Device) => void;
  onTargetValueChange: (value: string) => void;
  restorePrevious: boolean;
  onRestorePreviousChange: (value: boolean) => void;
  cooldown: string;
  onCooldownChange: (value: string) => void;
  name: string;
  onNameChange: (value: string) => void;
  attemptedSubmit: boolean;
  error: string | null;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export function AutomationForm(props: AutomationFormProps) {
  const {
    editing, inputDevices, outputDevices, sourceId, onSourceChange, operator, onOperatorChange,
    comparisonValue, onComparisonValueChange, targetId, targetValue, onTargetSelect,
    onTargetValueChange, restorePrevious, onRestorePreviousChange, cooldown, onCooldownChange,
    name, onNameChange, attemptedSubmit, error, saving, onSave, onCancel,
  } = props;
  const sourceDevice = inputDevices.find((device) => device.id === sourceId);
  const targetDevice = outputDevices.find((device) => device.id === targetId);
  const availableOperators = sourceDevice?.type === "temperature" ? numericOperators : binaryOperators;
  const comparisonNumber = Number(comparisonValue.replace(",", "."));
  const targetNumber = Number(targetValue.replace(",", "."));

  return (
    <SurfaceCard>
      <Text style={{ ...typography.section, color: colors.ink }}>{editing ? "Editar automação" : "Nova automação"}</Text>
      <FormField
        label="Nome *" placeholder="Ex.: Acender luz ao detectar presença" value={name}
        onChangeText={onNameChange} maxLength={100}
        helperText="Escolha um nome fácil de reconhecer na lista de regras."
        error={attemptedSubmit && !name.trim() ? "Este campo é obrigatório." : undefined}
      />

      <View style={{ gap: spacing.xs }}>
        <Text style={{ ...typography.label, color: colors.text }}>1. Quando esta entrada...</Text>
        <AutomationDeviceChoices devices={inputDevices} selectedId={sourceId} onSelect={onSourceChange} />
        {attemptedSubmit && !sourceDevice && <Text style={{ ...typography.caption, color: colors.error }}>Selecione um dispositivo de entrada.</Text>}
      </View>

      {sourceDevice && <>
        <View style={{ gap: spacing.xs }}>
          <Text style={{ ...typography.label, color: colors.text }}>2. ...apresentar esta condição</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
            {availableOperators.map((item) => <Choice key={item} label={operatorLabels[item]} selected={operator === item} onPress={() => onOperatorChange(item)} />)}
          </View>
        </View>
        {sourceDevice.type === "temperature" ? (
          <FormField label={`Temperatura de comparação (${sourceDevice.value_unit || "°C"})`} placeholder="Ex.: 25" value={comparisonValue} onChangeText={onComparisonValueChange} keyboardType="decimal-pad" helperText="A regra compara a leitura do sensor com este valor." error={attemptedSubmit && (!comparisonValue.trim() || !Number.isFinite(comparisonNumber)) ? "Informe um número válido para a comparação." : undefined} />
        ) : (
          <View style={{ gap: spacing.xs }}>
            <Text style={{ ...typography.label, color: colors.text }}>Estado da entrada</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
              <Choice label={formatValue(sourceDevice, 0)} selected={Number(comparisonValue) === 0} onPress={() => onComparisonValueChange("0")} />
              <Choice label={formatValue(sourceDevice, 1)} selected={Number(comparisonValue) === 1} onPress={() => onComparisonValueChange("1")} />
            </View>
          </View>
        )}
      </>}

      <View style={{ gap: spacing.xs }}>
        <Text style={{ ...typography.label, color: colors.text }}>3. Então controlar esta saída</Text>
        <AutomationDeviceChoices devices={outputDevices} selectedId={targetId} onSelect={onTargetSelect} />
        {attemptedSubmit && !targetDevice && <Text style={{ ...typography.caption, color: colors.error }}>Selecione um dispositivo de saída.</Text>}
      </View>
      {targetDevice?.type === "pwm" ? (
        <FormField label="Intensidade da saída (0 a 100%)" placeholder="Ex.: 50" value={targetValue} onChangeText={onTargetValueChange} keyboardType="number-pad" helperText="Informe uma intensidade entre 0% (desligado) e 100% (máximo)." error={attemptedSubmit && (!targetValue.trim() || !Number.isFinite(targetNumber) || targetNumber < 0 || targetNumber > 100) ? "Use um valor entre 0 e 100%." : undefined} />
      ) : targetDevice ? (
        <View style={{ gap: spacing.xs }}>
          <Text style={{ ...typography.label, color: colors.text }}>Estado desejado</Text>
          <View style={{ flexDirection: "row", gap: spacing.xs }}>
            <Choice label="Desligado" selected={Number(targetValue) === 0} onPress={() => onTargetValueChange("0")} />
            <Choice label="Ligado" selected={Number(targetValue) === 1} onPress={() => onTargetValueChange("1")} />
          </View>
        </View>
      ) : null}

      {!restorePrevious && <FormField label="Intervalo mínimo entre ativações (segundos)" placeholder="0" value={cooldown} onChangeText={onCooldownChange} keyboardType="number-pad" helperText="Use 0 para permitir que a regra seja executada sempre que a condição for atendida." error={attemptedSubmit && (!Number.isInteger(Number(cooldown)) || Number(cooldown) < 0 || Number(cooldown) > 86400) ? "Use um inteiro entre 0 e 86400 segundos." : undefined} />}

      <View style={{ gap: spacing.xs }}>
        <Text style={{ ...typography.label, color: colors.text }}>Quando a condição terminar</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
          <Choice label="Restaurar estado anterior" selected={restorePrevious} onPress={() => onRestorePreviousChange(true)} />
          <Choice label="Manter o estado atual" selected={!restorePrevious} onPress={() => onRestorePreviousChange(false)} />
        </View>
        <Text style={{ ...typography.caption, color: colors.muted }}>
          {restorePrevious ? "O controle manual fica bloqueado enquanto a condição estiver ativa. Quando ela terminar, o estado anterior é restaurado e o controle é liberado." : "Quando a condição terminar, a automação mantém o estado aplicado e libera o controle manual."} Pausar ou excluir a regra libera o controle imediatamente, mantendo o estado atual.
        </Text>
      </View>
      {error && <Text accessibilityRole="alert" style={{ color: colors.error }}>{error}</Text>}
      <PrimaryButton label={editing ? "Salvar automação" : "Criar automação"} onPress={onSave} loading={saving} />
      <Pressable accessibilityRole="button" onPress={onCancel} style={{ minHeight: layout.minTouchTarget, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ ...typography.bodyStrong, color: colors.muted }}>Cancelar</Text>
      </Pressable>
    </SurfaceCard>
  );
}

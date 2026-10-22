import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { AutomationOperator, AutomationRule, Device } from "@/types";
import {
  useCreateAutomation,
  useRemoveAutomation,
  useRoomAutomations,
  useUpdateAutomation,
} from "@/hooks/useAutomations";
import { useRoomDevices } from "@/hooks/useDevices";
import { Screen } from "@/components/Screen";
import { SurfaceCard } from "@/components/SurfaceCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { colors, spacing, typography } from "@/theme/tokens";
import { useAuth } from "@/context/AuthContext";
import { confirmAction } from "@/utils/confirm-action";
import { AutomationForm } from "@/features/automations/components/AutomationForm";
import { AutomationRuleCard } from "@/features/automations/components/AutomationRuleCard";

const numericOperators: AutomationOperator[] = ["eq", "ne", "gt", "gte", "lt", "lte"];
const binaryOperators: AutomationOperator[] = ["eq", "ne"];

function isEnabled(rule: AutomationRule) {
  return rule.is_enabled === true || rule.is_enabled === 1;
}

function isActive(rule: AutomationRule) {
  return rule.is_active === true || rule.is_active === 1;
}

function restoresPrevious(rule: AutomationRule) {
  return rule.restore_previous === true || rule.restore_previous === 1;
}

export default function RoomAutomationsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = Number(id);
  const { isAdmin } = useAuth();
  const {
    data: devices = [],
    isLoading: devicesLoading,
    isError: devicesError,
    refetch: refetchDevices,
  } = useRoomDevices(roomId);
  const { data: automations = [], isLoading, isError, refetch } = useRoomAutomations(roomId);
  const create = useCreateAutomation(roomId);
  const update = useUpdateAutomation(roomId);
  const remove = useRemoveAutomation(roomId);
  const inputDevices = useMemo(
    () => devices.filter((device) => device.direction === "input"),
    [devices],
  );
  const outputDevices = useMemo(
    () => devices.filter((device) => device.direction === "output"),
    [devices],
  );

  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [sourceId, setSourceId] = useState(0);
  const [operator, setOperator] = useState<AutomationOperator>("gte");
  const [comparisonValue, setComparisonValue] = useState("");
  const [targetId, setTargetId] = useState(0);
  const [targetValue, setTargetValue] = useState("1");
  const [restorePrevious, setRestorePrevious] = useState(true);
  const [cooldown, setCooldown] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const sourceDevice = inputDevices.find((device) => device.id === sourceId);
  const targetDevice = outputDevices.find((device) => device.id === targetId);
  const availableOperators =
    sourceDevice?.type === "temperature" ? numericOperators : binaryOperators;

  useEffect(() => {
    if (!sourceId && inputDevices[0]) setSourceId(inputDevices[0].id);
    if (!targetId && outputDevices[0]) setTargetId(outputDevices[0].id);
  }, [inputDevices, outputDevices, sourceId, targetId]);

  useEffect(() => {
    if (!isAdmin) setFormVisible(false);
  }, [isAdmin]);

  useEffect(() => {
    if (!availableOperators.includes(operator)) setOperator("eq");
  }, [availableOperators, operator]);

  function clearForm() {
    setEditingId(null);
    setName("");
    setSourceId(inputDevices[0]?.id ?? 0);
    setOperator("gte");
    setComparisonValue(inputDevices[0]?.type === "temperature" ? "25" : "1");
    setTargetId(outputDevices[0]?.id ?? 0);
    setTargetValue("1");
    setRestorePrevious(true);
    setCooldown("0");
    setError(null);
    setAttemptedSubmit(false);
  }

  function startEdit(rule: AutomationRule) {
    setEditingId(rule.id);
    setName(rule.name);
    setSourceId(rule.source_sensor_id);
    setOperator(rule.operator);
    setComparisonValue(String(rule.comparison_value));
    setTargetId(rule.target_sensor_id);
    setTargetValue(String(rule.target_value));
    setRestorePrevious(restoresPrevious(rule));
    setCooldown(String(rule.cooldown_seconds ?? 0));
    setError(null);
    setAttemptedSubmit(false);
    setFormVisible(true);
  }

  function selectTarget(device: Device) {
    setTargetId(device.id);
    setTargetValue(device.type === "pwm" ? "50" : "1");
  }

  async function saveAutomation() {
    if (!isAdmin) return;
    setAttemptedSubmit(true);
    setError(null);
    const threshold = Number(comparisonValue.replace(",", "."));
    const target = Number(targetValue.replace(",", "."));
    const cooldownSeconds = restorePrevious ? 0 : Number(cooldown);
    if (!name.trim() || name.trim().length > 100)
      return setError("Informe um nome de até 100 caracteres.");
    if (!sourceDevice || !targetDevice)
      return setError("Selecione os dispositivos de entrada e saída.");
    if (!comparisonValue.trim() || !Number.isFinite(threshold))
      return setError("Informe o valor que dispara a automação.");
    if (!targetValue.trim() || !Number.isFinite(target))
      return setError("Informe um valor válido para o dispositivo de saída.");
    if (targetDevice.type === "pwm" && (target < 0 || target > 100))
      return setError("A intensidade deve ficar entre 0 e 100%.");
    if (!restorePrevious && (!Number.isInteger(cooldownSeconds) || cooldownSeconds < 0 || cooldownSeconds > 86400))
      return setError("O intervalo deve ser um número inteiro entre 0 e 86400 segundos.");

    const input = {
      name: name.trim(),
      source_sensor_id: sourceDevice.id,
      operator,
      comparison_value: threshold,
      target_sensor_id: targetDevice.id,
      target_value: target,
      restore_previous: restorePrevious,
      cooldown_seconds: cooldownSeconds,
      is_enabled: true,
    };
    try {
      if (editingId) await update.mutateAsync({ id: editingId, ...input });
      else await create.mutateAsync(input);
      setFormVisible(false);
      clearForm();
    } catch {
      setError(
        "Não foi possível salvar. Confira os valores e se os dispositivos pertencem à sala.",
      );
    }
  }

  async function toggleAutomation(rule: AutomationRule) {
    if (!isAdmin) return;
    try {
      await update.mutateAsync({
        id: rule.id,
        name: rule.name,
        source_sensor_id: rule.source_sensor_id,
        operator: rule.operator,
        comparison_value: rule.comparison_value,
        target_sensor_id: rule.target_sensor_id,
        target_value: rule.target_value,
        restore_previous: restoresPrevious(rule),
        cooldown_seconds: rule.cooldown_seconds,
        is_enabled: !isEnabled(rule),
      });
    } catch {
      setError("Não foi possível alterar o status da automação.");
    }
  }

  async function removeAutomation(rule: AutomationRule) {
    if (!isAdmin) return;
    if (!(await confirmAction("Excluir automação", `Deseja excluir “${rule.name}”?`))) return;
    try {
      await remove.mutateAsync(rule.id);
    } catch {
      setError("Não foi possível excluir a automação.");
    }
  }

  if (devicesLoading || isLoading) return <LoadingState label="Carregando automações..." />;
  if (devicesError)
    return (
      <ErrorState
        message="Não foi possível carregar os dispositivos da sala."
        onRetry={() => refetchDevices()}
      />
    );
  if (isError)
    return (
      <ErrorState message="Não foi possível carregar as automações." onRetry={() => refetch()} />
    );

  return (
    <Screen contentContainerStyle={{ gap: spacing.md }}>
      <View style={{ gap: spacing.xs }}>
        <Text style={{ ...typography.title, color: colors.ink }}>Automações da sala</Text>
        <Text style={{ ...typography.body, color: colors.muted }}>
          Defina uma condição para uma entrada e escolha o que uma saída deve fazer.
          {!isAdmin ? " A visualização está disponível para colaboradores." : ""}
        </Text>
      </View>
      {error && !formVisible && (
        <Text accessibilityRole="alert" style={{ color: colors.error, fontWeight: "600" }}>
          {error}
        </Text>
      )}

      {isAdmin && !formVisible && (
        <PrimaryButton
          label="Criar automação"
          onPress={() => {
            clearForm();
            setFormVisible(true);
          }}
          disabled={!inputDevices.length || !outputDevices.length}
        />
      )}

      {isAdmin && formVisible && (
        <AutomationForm
          editing={editingId !== null}
          inputDevices={inputDevices}
          outputDevices={outputDevices}
          sourceId={sourceId}
          onSourceChange={(device) => {
            setSourceId(device.id);
            setComparisonValue(device.type === "temperature" ? "25" : "1");
          }}
          operator={operator}
          onOperatorChange={setOperator}
          comparisonValue={comparisonValue}
          onComparisonValueChange={setComparisonValue}
          targetId={targetId}
          targetValue={targetValue}
          onTargetSelect={selectTarget}
          onTargetValueChange={setTargetValue}
          restorePrevious={restorePrevious}
          onRestorePreviousChange={setRestorePrevious}
          cooldown={cooldown}
          onCooldownChange={setCooldown}
          name={name}
          onNameChange={setName}
          attemptedSubmit={attemptedSubmit}
          error={error}
          saving={create.isPending || update.isPending}
          onSave={() => void saveAutomation()}
          onCancel={() => {
            setFormVisible(false);
            clearForm();
          }}
        />
      )}
      {!inputDevices.length || !outputDevices.length ? (
        <SurfaceCard>
          <Text style={{ ...typography.body, color: colors.warning }}>
            Para criar uma automação, a sala precisa ter ao menos uma entrada (sensor) e uma saída
            (atuador).
          </Text>
        </SurfaceCard>
      ) : null}

      {automations.length === 0 ? (
        <EmptyState icon="git-branch-outline" message="Ainda não há automações nesta sala." />
      ) : (
        <View style={{ gap: spacing.md }}>
          {automations.map((rule) => (
            <AutomationRuleCard
              key={rule.id}
              rule={rule}
              source={devices.find((device) => device.id === rule.source_sensor_id)}
              target={devices.find((device) => device.id === rule.target_sensor_id)}
              isAdmin={isAdmin}
              onEdit={() => startEdit(rule)}
              onToggle={() => void toggleAutomation(rule)}
              onRemove={() => void removeAutomation(rule)}
            />
          ))}
        </View>
      )}
      {(remove.isPending || update.isPending) && (
        <Text style={{ ...typography.caption, color: colors.muted, textAlign: "center" }}>
          Atualizando automação...
        </Text>
      )}
    </Screen>
  );
}

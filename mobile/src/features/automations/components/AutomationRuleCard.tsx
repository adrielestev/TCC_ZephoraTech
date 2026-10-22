import { Pressable, Text, View } from "react-native";
import { AutomationOperator, AutomationRule, Device } from "@/types";
import { SurfaceCard } from "@/components/SurfaceCard";
import { colors, layout, radii, spacing, typography } from "@/theme/tokens";

const operatorLabels: Record<AutomationOperator, string> = {
  eq: "igual a", ne: "diferente de", gt: "maior que", gte: "maior ou igual a",
  lt: "menor que", lte: "menor ou igual a",
};

function isEnabled(rule: AutomationRule) { return rule.is_enabled === true || rule.is_enabled === 1; }
function isActive(rule: AutomationRule) { return rule.is_active === true || rule.is_active === 1; }
function restoresPrevious(rule: AutomationRule) { return rule.restore_previous === true || rule.restore_previous === 1; }

function formatValue(device: Device | undefined, value: number | null) {
  if (value == null) return "valor desconhecido";
  if (!device) return String(value);
  if (device.type === "temperature") return `${value} ${device.value_unit || "°C"}`;
  if (device.type === "pwm") return `${value}%`;
  if (device.type === "presence") return value > 0 ? "presença detectada" : "sem presença";
  if (device.type === "contact") return value > 0 ? "aberto" : "fechado";
  return value > 0 ? "ligado" : "desligado";
}

function Action({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({
    minHeight: layout.minTouchTarget, justifyContent: "center", paddingHorizontal: spacing.md,
    borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border,
    backgroundColor: pressed ? colors.primarySoft : colors.surface,
  })}><Text style={{ ...typography.caption, color: colors.text }}>{label}</Text></Pressable>;
}

export function AutomationRuleCard({ rule, source, target, isAdmin, onEdit, onToggle, onRemove }: {
  rule: AutomationRule;
  source?: Device;
  target?: Device;
  isAdmin: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const active = isActive(rule);
  const enabled = isEnabled(rule);
  const restore = restoresPrevious(rule);
  return <SurfaceCard>
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.sm }}>
      <Text style={{ ...typography.section, flex: 1, color: colors.ink }}>{rule.name}</Text>
      <Text style={{ ...typography.caption, color: active ? colors.warning : enabled ? colors.success : colors.muted }}>
        {active ? "Condição ativa · saída bloqueada" : enabled ? "Ativa" : "Pausada"}
      </Text>
    </View>
    <Text style={{ ...typography.body, color: colors.text }}>
      Se {source?.name ?? "entrada removida"} for {operatorLabels[rule.operator]} {formatValue(source, rule.comparison_value)}, então {target?.name ?? "saída removida"} fica {formatValue(target, rule.target_value)}.
    </Text>
    {restore && <Text style={{ ...typography.caption, color: colors.muted }}>
      Ao terminar: restaurar estado anterior{active ? ` (${formatValue(target, rule.previous_target_value ?? 0)})` : ""}.
    </Text>}
    {active && <Text style={{ ...typography.caption, color: colors.warning }}>
      O controle manual está bloqueado. Aguarde a condição terminar ou pause/exclua esta automação.
    </Text>}
    <Text style={{ ...typography.caption, color: colors.muted }}>Intervalo: {rule.cooldown_seconds} s</Text>
    {isAdmin && <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
      {!active && <Action label="Editar" onPress={onEdit} />}
      <Action label={enabled ? "Pausar" : "Ativar"} onPress={onToggle} />
      <Action label="Excluir" onPress={onRemove} />
    </View>}
  </SurfaceCard>;
}

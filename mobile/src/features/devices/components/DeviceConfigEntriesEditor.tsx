import { Pressable, Text, View } from "react-native";
import { FormField } from "@/components/FormField";
import { colors, layout, radii, spacing, typography } from "@/theme/tokens";

export type ConfigValueKind = "text" | "number" | "boolean" | "json";
export interface ConfigEntry {
  id: string;
  key: string;
  value: string;
  kind: ConfigValueKind;
}

export function configEntriesFromObject(config: Record<string, unknown> = {}): ConfigEntry[] {
  return Object.entries(config).map(([key, value], index) => {
    if (typeof value === "boolean") return { id: `config-${index}`, key, value: String(value), kind: "boolean" };
    if (typeof value === "number") return { id: `config-${index}`, key, value: String(value), kind: "number" };
    if (value !== null && typeof value === "object") return { id: `config-${index}`, key, value: JSON.stringify(value, null, 2), kind: "json" };
    return { id: `config-${index}`, key, value: value == null ? "" : String(value), kind: "text" };
  });
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => ({
    minHeight: layout.minTouchTarget, justifyContent: "center", paddingHorizontal: spacing.md,
    borderRadius: radii.pill, borderWidth: 1, borderColor: selected ? colors.primary : colors.border,
    backgroundColor: selected ? colors.primarySoft : colors.surface, opacity: pressed ? 0.7 : 1,
  })}><Text style={{ ...typography.caption, color: selected ? colors.primary : colors.text }}>{label}</Text></Pressable>;
}

function entryError(entry: ConfigEntry, entries: ConfigEntry[], attemptedSubmit: boolean) {
  if (!attemptedSubmit) return undefined;
  const key = entry.key.trim();
  if (!key) return "Informe o nome desta opção.";
  if (entries.some((other) => other.id !== entry.id && other.key.trim() === key)) return "Já existe uma opção com este nome.";
  if (entry.kind === "number" && (!entry.value.trim() || !Number.isFinite(Number(entry.value.replace(",", "."))))) return "Informe um número válido.";
  if (entry.kind === "json") {
    try { JSON.parse(entry.value); } catch { return "Informe uma lista ou objeto JSON válido."; }
  }
  return undefined;
}

export function DeviceConfigEntriesEditor({ entries, onChange, attemptedSubmit }: {
  entries: ConfigEntry[];
  onChange: (entries: ConfigEntry[]) => void;
  attemptedSubmit: boolean;
}) {
  function updateEntry(id: string, changes: Partial<Omit<ConfigEntry, "id">>) {
    onChange(entries.map((entry) => entry.id === id ? { ...entry, ...changes } : entry));
  }

  return <>
    <View style={{ gap: spacing.xs }}>
      <Text style={{ ...typography.label, color: colors.text }}>Parâmetros adicionais</Text>
      <Text style={{ ...typography.caption, color: colors.muted }}>
        Adicione opções reconhecidas pelo firmware do ESP32. Não é necessário escrever JSON.
      </Text>
    </View>
    {entries.length === 0 && <Text style={{ ...typography.caption, color: colors.muted }}>Nenhum parâmetro adicional configurado.</Text>}
    {entries.map((entry, index) => <View key={entry.id} style={{
      gap: spacing.sm, padding: spacing.md, borderWidth: 1, borderColor: colors.border,
      borderRadius: radii.field, backgroundColor: colors.surfaceMuted,
    }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ ...typography.bodyStrong, color: colors.ink }}>Parâmetro {index + 1}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`Remover parâmetro ${index + 1}`} onPress={() => onChange(entries.filter((item) => item.id !== entry.id))} hitSlop={8}>
          <Text style={{ ...typography.caption, color: colors.error }}>Remover</Text>
        </Pressable>
      </View>
      <FormField label="Nome da opção *" placeholder="Ex.: intervalo_ms" value={entry.key} onChangeText={(key) => updateEntry(entry.id, { key })} autoCapitalize="none" autoCorrect={false} helperText="Chave enviada ao firmware; use o identificador esperado pelo ESP32." error={entryError(entry, entries, attemptedSubmit)} />
      <Text style={{ ...typography.caption, color: colors.text }}>Tipo do valor</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
        {([["text", "Texto"], ["number", "Número"], ["boolean", "Sim/Não"], ["json", "Lista/objeto"]] as const).map(([kind, label]) => <Choice key={kind} label={label} selected={entry.kind === kind} onPress={() => updateEntry(entry.id, { kind, value: kind === "boolean" ? "false" : kind === "json" ? "{}" : "" })} />)}
      </View>
      {entry.kind === "boolean" ? <View style={{ flexDirection: "row", gap: spacing.xs }}>
        <Choice label="Não" selected={entry.value === "false"} onPress={() => updateEntry(entry.id, { value: "false" })} />
        <Choice label="Sim" selected={entry.value === "true"} onPress={() => updateEntry(entry.id, { value: "true" })} />
      </View> : <FormField
        label="Valor *" placeholder={entry.kind === "number" ? "Ex.: 1000" : entry.kind === "json" ? 'Ex.: {"faixa": [0, 100]}' : "Digite o valor"}
        value={entry.value} onChangeText={(value) => updateEntry(entry.id, { value })}
        keyboardType={entry.kind === "number" ? "decimal-pad" : "default"} autoCapitalize="none"
        helperText={entry.kind === "number" ? "Digite um número; vírgula ou ponto decimal são aceitos." : entry.kind === "json" ? "Informe uma lista ou objeto JSON válido." : "Texto enviado ao firmware para esta opção."}
        error={entryError(entry, entries, attemptedSubmit)} multiline={entry.kind === "json"}
        style={entry.kind === "json" ? { minHeight: 88, textAlignVertical: "top", paddingTop: spacing.sm } : undefined}
      />}
    </View>)}
    <Pressable accessibilityRole="button" onPress={() => onChange([...entries, { id: `new-${Date.now()}-${Math.random()}`, key: "", value: "", kind: "text" }])} style={({ pressed }) => ({
      minHeight: layout.minTouchTarget, justifyContent: "center", alignItems: "center", borderWidth: 1,
      borderColor: colors.primary, borderRadius: radii.button, backgroundColor: pressed ? colors.primarySoft : colors.surface,
    })}>
      <Text style={{ ...typography.bodyStrong, color: colors.primary }}>+ Adicionar parâmetro</Text>
    </Pressable>
  </>;
}

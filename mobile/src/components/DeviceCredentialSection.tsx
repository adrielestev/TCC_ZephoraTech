import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { useGenerateDeviceCredential } from "../hooks/useRooms";
import { colors, radii, spacing, typography } from "../theme/tokens";
import { confirmAction } from "../utils/confirm-action";
import { copySecret } from "../utils/copy-secret";
import { FeedbackMessage } from "./FeedbackMessage";
import { IconButton } from "./IconButton";
import { PrimaryButton } from "./PrimaryButton";
import { SurfaceCard } from "./SurfaceCard";

interface DeviceCredentialSectionProps {
  roomId: number;
  macAddress: string;
  hasCredential: boolean;
}

type Feedback = { message: string; variant: "error" | "success" };

const monospace = Platform.select({ ios: "Menlo", default: "monospace" });

export function DeviceCredentialSection({
  roomId,
  macAddress,
  hasCredential,
}: DeviceCredentialSectionProps) {
  const generateCredential = useGenerateDeviceCredential(roomId);
  // O segredo vive só neste estado: some ao ocultar ou ao sair da tela.
  const [credential, setCredential] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  async function handleGenerate() {
    setFeedback(null);

    if (
      hasCredential &&
      !(await confirmAction(
        "Rotacionar credencial",
        "A credencial atual deixará de funcionar e o ESP32 perderá o acesso até ser atualizado com a nova. Deseja continuar?",
      ))
    ) {
      return;
    }

    try {
      setCredential(await generateCredential.mutateAsync());
    } catch {
      setFeedback({ message: "Não foi possível gerar a credencial.", variant: "error" });
    }
  }

  async function handleCopy() {
    if (!credential) return;

    const result = await copySecret(credential);
    if (result === "copied") {
      setFeedback({ message: "Credencial copiada.", variant: "success" });
    } else if (result === "failed") {
      setFeedback({
        message: "Não foi possível copiar. Selecione o texto e copie manualmente.",
        variant: "error",
      });
    }
  }

  function handleHide() {
    setCredential(null);
    setFeedback(null);
  }

  return (
    <SurfaceCard>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <Text style={{ ...typography.section, color: colors.ink, flexShrink: 1 }}>
          Credencial do ESP32
        </Text>
        <View
          style={{
            paddingHorizontal: spacing.sm,
            paddingVertical: 4,
            borderRadius: radii.pill,
            backgroundColor: hasCredential ? colors.successSoft : colors.warningSoft,
          }}
        >
          <Text
            style={{
              ...typography.caption,
              color: hasCredential ? colors.success : colors.warning,
            }}
          >
            {hasCredential ? "Ativa" : "Não gerada"}
          </Text>
        </View>
      </View>

      <Text style={{ ...typography.body, color: colors.muted }}>
        Token único desta sala. O ESP32 deve enviá-lo no header X-Device-Credential, junto com o MAC
        no header X-Device-MAC, em todas as requisições.
      </Text>

      {credential ? (
        <View style={{ gap: spacing.sm }}>
          <View
            style={{
              padding: spacing.sm,
              borderRadius: radii.field,
              backgroundColor: colors.warningSoft,
            }}
          >
            <Text style={{ ...typography.body, color: colors.warning }}>
              Copie agora e grave no firmware. Por segurança, esta credencial não será exibida
              novamente.
            </Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <Text
              selectable
              accessibilityLabel="Credencial gerada"
              style={{
                flex: 1,
                padding: spacing.sm,
                borderRadius: radii.field,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surfaceMuted,
                color: colors.ink,
                fontFamily: monospace,
                fontSize: 13,
                lineHeight: 19,
              }}
            >
              {credential}
            </Text>
            <IconButton icon="copy-outline" label="Copiar credencial" onPress={handleCopy} />
          </View>

          <Text selectable style={{ ...typography.caption, color: colors.muted }}>
            X-Device-MAC: {macAddress}
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ocultar credencial"
            onPress={handleHide}
            hitSlop={8}
          >
            <Text
              style={{
                ...typography.bodyStrong,
                color: colors.primary,
                textDecorationLine: "underline",
              }}
            >
              Já copiei, ocultar
            </Text>
          </Pressable>
        </View>
      ) : (
        <PrimaryButton
          label={hasCredential ? "Rotacionar credencial" : "Gerar credencial"}
          onPress={handleGenerate}
          loading={generateCredential.isPending}
        />
      )}

      {feedback && (
        <FeedbackMessage
          message={feedback.message}
          variant={feedback.variant}
          onDismiss={() => setFeedback(null)}
        />
      )}
    </SurfaceCard>
  );
}

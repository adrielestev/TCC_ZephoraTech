import { Modal, Pressable, Image, Text, View } from "react-native";
import { colors, layout, spacing } from "../theme/tokens";

interface ImageViewerModalProps {
  visible: boolean;
  uri: string | null;
  label: string;
  onClose: () => void;
}

export function ImageViewerModal({ visible, uri, label, onClose }: ImageViewerModalProps) {
  if (!uri) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        accessible
        accessibilityViewIsModal
        style={{ flex: 1, backgroundColor: "rgba(5, 15, 26, 0.96)" }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar visualização da imagem"
          onPress={onClose}
          hitSlop={8}
          style={({ pressed }) => ({
            position: "absolute",
            zIndex: 1,
            top: spacing.lg,
            right: spacing.lg,
            minWidth: layout.minTouchTarget,
            minHeight: layout.minTouchTarget,
            borderRadius: layout.minTouchTarget / 2,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: pressed ? "rgba(255,255,255,0.24)" : "rgba(255,255,255,0.14)",
          })}
        >
          <Text style={{ color: colors.white, fontSize: 24, lineHeight: 28 }}>X</Text>
        </Pressable>
        <Pressable
          accessibilityRole="image"
          accessibilityLabel={label}
          onPress={onClose}
          style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg }}
        >
          <Image
            source={{ uri }}
            accessibilityLabel={label}
            resizeMode="contain"
            style={{ width: "100%", height: "80%" }}
          />
          <Text style={{ color: "rgba(255,255,255,0.72)", marginTop: spacing.md }}>{label}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

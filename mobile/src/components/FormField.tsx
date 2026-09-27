import { forwardRef, useState } from "react";
import { Pressable, Text, TextInput, TextInputProps, View } from "react-native";
import { colors, radii, spacing } from "../theme/tokens";

export const FormField = forwardRef<TextInput, TextInputProps & { label: string }>(
  ({ label, style, secureTextEntry, ...props }, ref) => {
    const [isVisible, setIsVisible] = useState(false);
    const hasPasswordToggle = secureTextEntry === true;

    return (
      <View style={{ gap: spacing.xs, width: "100%" }}>
        <Text style={{ fontWeight: "700", color: colors.text, fontSize: 13 }}>{label}</Text>
        <View style={{ position: "relative", justifyContent: "center" }}>
          <TextInput
            ref={ref}
            {...props}
            secureTextEntry={hasPasswordToggle ? !isVisible : secureTextEntry}
            style={[
              {
                minHeight: 52,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radii.field,
                paddingHorizontal: spacing.md,
                paddingRight: hasPasswordToggle ? 88 : spacing.md,
                color: colors.ink,
                backgroundColor: "rgba(255, 255, 255, 0.82)",
                fontSize: 16,
              },
              style,
            ]}
            placeholderTextColor={colors.muted}
          />
          {hasPasswordToggle && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isVisible ? "Ocultar senha" : "Mostrar senha"}
              accessibilityState={{ selected: isVisible }}
              onPress={() => setIsVisible((visible) => !visible)}
              hitSlop={8}
              style={{
                position: "absolute",
                right: spacing.md,
                minHeight: 44,
                justifyContent: "center",
              }}
            >
              <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>
                {isVisible ? "Ocultar" : "Mostrar"}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  },
);

FormField.displayName = "FormField";

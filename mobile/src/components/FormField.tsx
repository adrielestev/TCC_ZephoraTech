import { forwardRef, useState } from "react";
import { Pressable, Text, TextInput, TextInputProps, View } from "react-native";
import { colors, radii, spacing } from "../theme/tokens";

export const FormField = forwardRef<TextInput, TextInputProps & { label: string }>(
  ({ label, style, secureTextEntry, onFocus, onBlur, ...props }, ref) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const hasPasswordToggle = secureTextEntry === true;

    return (
      <View style={{ gap: spacing.xs, width: "100%" }}>
        <Text style={{ fontWeight: "700", color: colors.text, fontSize: 13 }}>{label}</Text>
        <View style={{ position: "relative", justifyContent: "center" }}>
          <TextInput
            ref={ref}
            {...props}
            onFocus={(event) => {
              setIsFocused(true);
              onFocus?.(event);
            }}
            onBlur={(event) => {
              setIsFocused(false);
              onBlur?.(event);
            }}
            secureTextEntry={hasPasswordToggle ? !isVisible : secureTextEntry}
            style={[
              {
                minHeight: 52,
                borderColor: isFocused ? colors.borderFocus : colors.border,
                borderWidth: isFocused ? 2 : 1,
                borderRadius: radii.field,
                paddingHorizontal: spacing.md,
                paddingRight: hasPasswordToggle ? 88 : spacing.md,
                color: colors.ink,
                backgroundColor: colors.surfaceSolid,
                fontSize: 16,
                ...(isFocused ? { paddingHorizontal: spacing.md - 1 } : {}),
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

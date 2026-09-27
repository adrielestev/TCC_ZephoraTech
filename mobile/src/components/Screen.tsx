import { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleProp, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../theme/tokens";

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export function Screen({ children, scroll = true, contentContainerStyle }: ScreenProps) {
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[
        { flexGrow: 1, padding: 20, alignItems: "center" },
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    children
  );

  return (
    <LinearGradient colors={[colors.backgroundTop, colors.backgroundBottom]} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {content}
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

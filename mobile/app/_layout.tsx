import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Redirect, Slot, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { ActivityIndicator, View } from "react-native";

const queryClient = new QueryClient();

function RootNavigation() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  const inAuthGroup = segments[0] === "(auth)";
  const inAppGroup = segments[0] === "(app)";

  if (!user && !inAuthGroup) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user && !inAppGroup) {
    return <Redirect href="/(app)" />;
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RootNavigation />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Redirect, Slot, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ActivityIndicator, View } from "react-native";
import "./safe-area.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

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
    return <Redirect href="/" />;
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RootNavigation />
      </AuthProvider>
    </QueryClientProvider>
  );
}

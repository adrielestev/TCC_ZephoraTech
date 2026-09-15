import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthNavigator } from './AuthNavigator';
import { useAuth } from '../hooks/useAuth';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Button } from '../components/Button';
import { Colors, Navigation, Spacing, FontSizes, FontWeights } from '../theme/constants';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { signed, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator 
      screenOptions={{
        headerShown: Navigation.headerShown,
        gestureEnabled: Navigation.gestureEnabled,
        gestureDirection: Navigation.gestureDirection,
        transitionSpec: Navigation.transitionSpec,
        animationTypeForReplace: 'push',
      }}
    >
      {signed ? (
        <Stack.Screen name="App" component={PlaceholderApp} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}

const PlaceholderApp = () => {
  const { logout, user } = useAuth();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Zephora Home</Text>
      <Text style={styles.subtitle}>Logado como: {user?.name}</Text>
      <Button title="Sair" onPress={logout} />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.xl,
  },
  title: {
    fontSize: FontSizes.xxxl,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.sm,
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: FontSizes.lg,
    color: Colors.text.tertiary,
    marginBottom: Spacing.xl,
  },
});

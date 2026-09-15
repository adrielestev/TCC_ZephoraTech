import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Animated } from 'react-native';
import { Screen } from '../../../components/Screen';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { AuthCard } from '../../../components/AuthCard';
import { ZephoraLogo } from '../../../components/ZephoraLogo';
import { useAuth } from '../../../hooks/useAuth';
import { useEntranceAnimation } from '../../../hooks/useEntranceAnimation';
import { useResponsive } from '../../../hooks/useResponsive';
import { Colors, Spacing, FontSizes, FontWeights } from '../../../theme/constants';

export function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const { isSmallScreen } = useResponsive();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const headerAnim = useEntranceAnimation({ delay: 0 });
  const cardAnim = useEntranceAnimation({ delay: 90 });
  const footerAnim = useEntranceAnimation({ delay: 180 });

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      await login({ email, password });
    } catch (err) {
      Alert.alert('Erro', err.response?.data?.message || 'Não foi possível fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scrollable>
      <View style={styles.container}>
        <Animated.View style={[styles.header, headerAnim]}>
          <ZephoraLogo variant="wordmark" size={isSmallScreen ? 56 : 64} />
        </Animated.View>

        <Animated.View style={cardAnim}>
          <AuthCard>
            <Text style={styles.cardTitle}>Login</Text>

            <Input
              label="Email"
              placeholder="seu@email.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <Input
              label="Senha"
              placeholder="••••••••"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <Button title="Entrar" onPress={handleLogin} loading={loading} style={styles.loginButton} />

            <Button
              title="Esqueci a senha"
              type="text"
              underline
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotButton}
            />
          </AuthCard>
        </Animated.View>

        <Animated.View style={[styles.footer, footerAnim]}>
          <Text style={styles.footerText}>Ainda não tem uma conta?</Text>
          <Button title="Cadastrar-se" type="text" underline onPress={() => navigation.navigate('Register')} />
        </Animated.View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  cardTitle: {
    fontSize: FontSizes.xxxl,
    fontWeight: FontWeights.extrabold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    letterSpacing: -0.5,
  },
  loginButton: {
    marginTop: Spacing.sm,
  },
  forgotButton: {
    alignSelf: 'center',
    marginTop: Spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xxl,
  },
  footerText: {
    color: Colors.text.tertiary,
    fontSize: FontSizes.md,
    marginRight: Spacing.sm,
  },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Animated } from 'react-native';
import { Screen } from '../../../components/Screen';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { AuthCard } from '../../../components/AuthCard';
import { ZephoraLogo } from '../../../components/ZephoraLogo';
import { AuthService } from '../services/auth.service';
import { useEntranceAnimation } from '../../../hooks/useEntranceAnimation';
import { useResponsive } from '../../../hooks/useResponsive';
import { Colors, Spacing, FontSizes, FontWeights } from '../../../theme/constants';

export function RegisterScreen({ navigation }) {
  const { isSmallScreen } = useResponsive();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const headerAnim = useEntranceAnimation({ delay: 0 });
  const cardAnim = useEntranceAnimation({ delay: 90 });
  const footerAnim = useEntranceAnimation({ delay: 180 });

  const handleRegister = async () => {
    if (!name || !email || !password) return;
    setLoading(true);
    try {
      await AuthService.register({ name, email, password });
      Alert.alert('Sucesso', 'Conta criada. Verifique seu e-mail!');
      navigation.navigate('VerifyEmail', { email });
    } catch (err) {
      Alert.alert('Erro', err.response?.data?.message || 'Falha no cadastro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scrollable>
      <View style={styles.container}>
        <Animated.View style={[styles.header, headerAnim]}>
          <ZephoraLogo variant="wordmark" size={isSmallScreen ? 56 : 64} />
          <Text style={styles.subtitle}>Junte-se ao Zephora para automatizar seu mundo.</Text>
        </Animated.View>

        <Animated.View style={cardAnim}>
          <AuthCard>
            <Text style={styles.cardTitle}>Criar Conta</Text>

            <Input label="Nome Completo" placeholder="Seu nome completo" value={name} onChangeText={setName} />
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
              placeholder="Mínimo 8 caracteres"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <Button title="Criar Conta" onPress={handleRegister} loading={loading} style={styles.registerButton} />
          </AuthCard>
        </Animated.View>

        <Animated.View style={[styles.footer, footerAnim]}>
          <Text style={styles.footerText}>Já possui conta?</Text>
          <Button title="Fazer Login" type="text" underline onPress={() => navigation.goBack()} />
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
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.text.tertiary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    lineHeight: 22,
  },
  cardTitle: {
    fontSize: FontSizes.xxxl,
    fontWeight: FontWeights.extrabold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    letterSpacing: -0.5,
  },
  registerButton: {
    marginTop: Spacing.sm,
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

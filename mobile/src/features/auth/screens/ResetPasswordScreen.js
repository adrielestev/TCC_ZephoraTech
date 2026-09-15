import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Animated } from 'react-native';
import { Screen } from '../../../components/Screen';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { AuthCard } from '../../../components/AuthCard';
import { AuthService } from '../services/auth.service';
import { useEntranceAnimation } from '../../../hooks/useEntranceAnimation';
import { Colors, Spacing, FontSizes, FontWeights, Heights } from '../../../theme/constants';

export function ResetPasswordScreen({ route, navigation }) {
  const { email } = route.params || {};
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const headerAnim = useEntranceAnimation({ delay: 0 });
  const cardAnim = useEntranceAnimation({ delay: 90 });
  const footerAnim = useEntranceAnimation({ delay: 180 });

  const handleReset = async () => {
    if (!code || !password) return;
    setLoading(true);
    try {
      await AuthService.resetPassword({ email, code, password });
      Alert.alert('Sucesso', 'Senha alterada com sucesso! Faça seu login.');
      navigation.navigate('Login');
    } catch (err) {
      Alert.alert('Erro', err.response?.data?.message || 'Falha ao redefinir');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scrollable>
      <View style={styles.container}>
        <Animated.View style={[styles.header, headerAnim]}>
          <View style={[styles.icon, { width: Heights.logo, height: Heights.logo, borderRadius: Heights.logo / 2 }]}>
            <Text style={styles.iconText}>🔒</Text>
          </View>
          <Text style={styles.title}>Redefinir Senha</Text>
          <Text style={styles.subtitle}>Digite o código que você recebeu e sua nova senha.</Text>
        </Animated.View>

        <Animated.View style={cardAnim}>
          <AuthCard>
            <Input
              label="Código de 6 dígitos"
              placeholder="000000"
              keyboardType="number-pad"
              maxLength={6}
              value={code}
              onChangeText={setCode}
              style={{ textAlign: 'center', fontSize: FontSizes.xxxl, letterSpacing: 8, fontWeight: FontWeights.semibold }}
            />
            <Input label="Nova Senha" placeholder="Mínimo 8 caracteres" secureTextEntry value={password} onChangeText={setPassword} />

            <Button title="Redefinir Senha" onPress={handleReset} loading={loading} style={styles.resetButton} />
          </AuthCard>
        </Animated.View>

        <Animated.View style={[styles.footer, footerAnim]}>
          <Button title="Voltar para o Login" type="text" underline onPress={() => navigation.goBack()} />
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
  icon: {
    backgroundColor: Colors.info,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    shadowColor: Colors.info,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  iconText: {
    fontSize: FontSizes.xxxl,
  },
  title: {
    fontSize: FontSizes.xxxl,
    fontWeight: FontWeights.extrabold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.text.tertiary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    lineHeight: 22,
  },
  resetButton: {
    marginTop: Spacing.sm,
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing.xxl,
  },
});

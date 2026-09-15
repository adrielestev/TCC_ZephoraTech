import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Animated } from 'react-native';
import { Screen } from '../../../components/Screen';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { AuthCard } from '../../../components/AuthCard';
import { AuthService } from '../services/auth.service';
import { useEntranceAnimation } from '../../../hooks/useEntranceAnimation';
import { Colors, Spacing, FontSizes, FontWeights, Heights } from '../../../theme/constants';

export function VerifyEmailScreen({ route, navigation }) {
  const { email } = route.params || {};
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const headerAnim = useEntranceAnimation({ delay: 0 });
  const cardAnim = useEntranceAnimation({ delay: 90 });

  const handleVerify = async () => {
    if (!code || code.length !== 6) return Alert.alert('Aviso', 'Digite o código de 6 dígitos.');
    setLoading(true);
    try {
      await AuthService.verifyEmail({ email, code });
      Alert.alert('Sucesso', 'E-mail verificado! Faça seu login.');
      navigation.navigate('Login');
    } catch (err) {
      Alert.alert('Erro', err.response?.data?.message || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await AuthService.resendCode({ email });
      Alert.alert('Sucesso', 'Código reenviado.');
    } catch (err) {
      Alert.alert('Erro', err.response?.data?.message || 'Falha ao reenviar');
    } finally {
      setResending(false);
    }
  };

  return (
    <Screen scrollable>
      <View style={styles.container}>
        <Animated.View style={[styles.header, headerAnim]}>
          <View style={[styles.icon, { width: Heights.logo, height: Heights.logo, borderRadius: Heights.logo / 2 }]}>
            <Text style={styles.iconText}>✓</Text>
          </View>
          <Text style={styles.title}>Verificar E-mail</Text>
          <Text style={styles.subtitle}>Enviamos um código para</Text>
          <Text style={styles.emailText}>{email}</Text>
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

            <Button title="Verificar Conta" onPress={handleVerify} loading={loading} style={styles.verifyButton} />

            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Não recebeu o código?</Text>
              <Button title="Reenviar" type="text" underline onPress={handleResend} loading={resending} />
            </View>
          </AuthCard>
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
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  iconText: {
    fontSize: FontSizes.xxxl,
    fontWeight: FontWeights.extrabold,
    color: '#FFFFFF',
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
  },
  emailText: {
    fontSize: FontSizes.md,
    color: Colors.primary,
    fontWeight: FontWeights.semibold,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  verifyButton: {
    marginTop: Spacing.sm,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  resendText: {
    color: Colors.text.tertiary,
    fontSize: FontSizes.md,
    marginRight: Spacing.sm,
  },
});

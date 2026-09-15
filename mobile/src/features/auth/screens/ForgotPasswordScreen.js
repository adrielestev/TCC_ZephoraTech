import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Animated } from 'react-native';
import { Screen } from '../../../components/Screen';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { AuthCard } from '../../../components/AuthCard';
import { AuthService } from '../services/auth.service';
import { useEntranceAnimation } from '../../../hooks/useEntranceAnimation';
import { useResponsive } from '../../../hooks/useResponsive';
import { Colors, Spacing, FontSizes, FontWeights, Heights } from '../../../theme/constants';

export function ForgotPasswordScreen({ navigation }) {
  const { isSmallScreen } = useResponsive();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const headerAnim = useEntranceAnimation({ delay: 0 });
  const cardAnim = useEntranceAnimation({ delay: 90 });
  const footerAnim = useEntranceAnimation({ delay: 180 });

  const handleSendCode = async () => {
    if (!email) return;
    setLoading(true);
    try {
      await AuthService.forgotPassword({ email });
      Alert.alert('Sucesso', 'Código enviado para seu e-mail.');
      navigation.navigate('ResetPassword', { email });
    } catch (err) {
      Alert.alert('Erro', err.response?.data?.message || 'Falha ao enviar e-mail');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scrollable>
      <View style={styles.container}>
        <Animated.View style={[styles.header, headerAnim]}>
          <View style={[styles.icon, { width: Heights.logo, height: Heights.logo, borderRadius: Heights.logo / 2 }]}>
            <Text style={styles.iconText}>?</Text>
          </View>
          <Text style={styles.title}>Esqueceu a Senha</Text>
          <Text style={styles.subtitle}>Enviaremos um código para você redefinir sua senha.</Text>
        </Animated.View>

        <Animated.View style={cardAnim}>
          <AuthCard>
            <Input
              label="Email"
              placeholder="seu@email.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <Button title="Enviar Código" onPress={handleSendCode} loading={loading} style={styles.sendButton} />
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
    backgroundColor: Colors.warning,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    shadowColor: Colors.warning,
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
    paddingHorizontal: Spacing.lg,
    lineHeight: 22,
  },
  sendButton: {
    marginTop: Spacing.sm,
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing.xxl,
  },
});

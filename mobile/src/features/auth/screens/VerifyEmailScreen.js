import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Screen } from '../../../components/Screen';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { AuthService } from '../services/auth.service';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Heights, Responsive } from '../../../theme/constants';

export function VerifyEmailScreen({ route, navigation }) {
  const { email } = route.params || {};
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

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
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <View style={styles.icon}>
              <Text style={styles.iconText}>✓</Text>
            </View>
          </View>
          <Text style={styles.title}>Verificar E-mail</Text>
          <Text style={styles.subtitle}>Enviamos um código para</Text>
          <Text style={styles.emailText}>{email}</Text>
        </View>
        
        <View style={styles.form}>
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
            <Button title="Reenviar" type="text" onPress={handleResend} loading={resending} />
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: Responsive.isSmallScreen ? Spacing.xl : Spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Responsive.isSmallScreen ? Spacing.xxl : Spacing.xxxl,
  },
  iconContainer: {
    marginBottom: Spacing.xl,
  },
  icon: {
    width: Heights.logo,
    height: Heights.logo,
    borderRadius: Heights.logo / 2,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  iconText: {
    fontSize: Responsive.isSmallScreen ? FontSizes.xxl : FontSizes.xxxl,
    fontWeight: FontWeights.extrabold,
    color: '#FFFFFF',
  },
  title: {
    fontSize: Responsive.isSmallScreen ? FontSizes.xxxl : FontSizes.huge,
    fontWeight: FontWeights.extrabold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: FontSizes.lg,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  emailText: {
    fontSize: FontSizes.lg,
    color: Colors.primary,
    fontWeight: FontWeights.semibold,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  form: {
    marginBottom: Responsive.isSmallScreen ? Spacing.xl : Spacing.xxl,
  },
  verifyButton: {
    marginTop: Spacing.sm,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Responsive.isSmallScreen ? Spacing.xl : Spacing.xxl,
  },
  resendText: {
    color: Colors.text.tertiary,
    fontSize: FontSizes.lg,
    marginRight: Spacing.sm,
  },
});

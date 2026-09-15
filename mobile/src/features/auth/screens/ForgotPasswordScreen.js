import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Screen } from '../../../components/Screen';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { AuthService } from '../services/auth.service';
import { Colors, Spacing, FontSizes, FontWeights, Heights, Responsive } from '../../../theme/constants';

export function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

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
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <View style={styles.icon}>
              <Text style={styles.iconText}>?</Text>
            </View>
          </View>
          <Text style={styles.title}>Esqueceu a Senha</Text>
          <Text style={styles.subtitle}>Enviaremos um código para você redefinir sua senha.</Text>
        </View>
        
        <View style={styles.form}>
          <Input 
            label="E-mail" 
            placeholder="seu@email.com" 
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          
          <Button title="Enviar Código" onPress={handleSendCode} loading={loading} style={styles.sendButton} />
        </View>

        <View style={styles.footer}>
          <Button 
            title="Voltar para o Login" 
            type="text" 
            onPress={() => navigation.goBack()} 
          />
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
    backgroundColor: Colors.warning,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.warning,
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
    paddingHorizontal: Spacing.lg,
    lineHeight: 24,
  },
  form: {
    marginBottom: Responsive.isSmallScreen ? Spacing.xl : Spacing.xxl,
  },
  sendButton: {
    marginTop: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
});

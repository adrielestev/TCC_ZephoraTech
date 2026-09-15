import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Screen } from '../../../components/Screen';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { ZephoraLogo } from '../../../components/ZephoraLogo';
import { useAuth } from '../../../hooks/useAuth';
import { Colors, Spacing, FontSizes, FontWeights, Responsive } from '../../../theme/constants';

export function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
        <View style={styles.header}>
          <ZephoraLogo />
          <Text style={styles.title}>Zephora</Text>
          <Text style={styles.subtitle}>Bem-vindo de volta! Acesse suas salas.</Text>
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
          <Input 
            label="Senha" 
            placeholder="••••••••" 
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          
          <View style={styles.forgotContainer}>
            <Button 
              title="Esqueceu a senha?" 
              type="text" 
              onPress={() => navigation.navigate('ForgotPassword')} 
            />
          </View>

          <Button title="Entrar" onPress={handleLogin} loading={loading} style={styles.loginButton} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Não tem uma conta?</Text>
          <Button 
            title="Criar agora" 
            type="text" 
            onPress={() => navigation.navigate('Register')} 
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
  forgotContainer: {
    alignItems: 'flex-end',
    marginBottom: Responsive.isSmallScreen ? Spacing.xl : Spacing.xxl,
  },
  loginButton: {
    marginTop: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  footerText: {
    color: Colors.text.tertiary,
    fontSize: FontSizes.lg,
    marginRight: Spacing.sm,
  },
});

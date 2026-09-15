import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Screen } from '../../../components/Screen';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { ZephoraLogo } from '../../../components/ZephoraLogo';
import { AuthService } from '../services/auth.service';
import { Colors, Spacing, FontSizes, FontWeights, Responsive } from '../../../theme/constants';

export function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
        <View style={styles.header}>
          <ZephoraLogo />
          <Text style={styles.title}>Criar Conta</Text>
          <Text style={styles.subtitle}>Junte-se ao Zephora para automatizar seu mundo.</Text>
        </View>
        
        <View style={styles.form}>
          <Input 
            label="Nome Completo" 
            placeholder="Seu nome completo" 
            value={name}
            onChangeText={setName}
          />
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
            placeholder="Mínimo 8 caracteres" 
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Button title="Criar Conta" onPress={handleRegister} loading={loading} style={styles.registerButton} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Já possui conta?</Text>
          <Button 
            title="Fazer Login" 
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
  registerButton: {
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

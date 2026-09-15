import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Screen } from '../../../components/Screen';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { AuthService } from '../services/auth.service';
import { Colors, Spacing, FontSizes, FontWeights, Heights, Responsive } from '../../../theme/constants';

export function ResetPasswordScreen({ route, navigation }) {
  const { email } = route.params || {};
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <View style={styles.icon}>
              <Text style={styles.iconText}>🔒</Text>
            </View>
          </View>
          <Text style={styles.title}>Redefinir Senha</Text>
          <Text style={styles.subtitle}>Digite o código que você recebeu e sua nova senha.</Text>
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
          <Input 
            label="Nova Senha" 
            placeholder="Mínimo 8 caracteres" 
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          
          <Button title="Redefinir Senha" onPress={handleReset} loading={loading} style={styles.resetButton} />
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
    backgroundColor: Colors.info,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.info,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  iconText: {
    fontSize: Responsive.isSmallScreen ? FontSizes.xxl : FontSizes.xxxl,
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
  resetButton: {
    marginTop: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
});

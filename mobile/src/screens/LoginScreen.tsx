import React, { useState } from "react"
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert,
} from "react-native"
import { MobileAuthService } from "../services/MobileAuthService"
import { User } from "../types"

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Atenção", "Preencha o e-mail e a senha.")
      return
    }

    setLoading(true)
    try {
      const user = await MobileAuthService.signIn(email, password)
      onLoginSuccess(user)
    } catch (err: any) {
      Alert.alert("Erro ao entrar", err.message || "Falha na autenticação.")
    } finally {
      setLoading(false)
    }
  }

  const fillAdmin = () => {
    setEmail("teste@teste.com")
    setPassword("teste1234")
  }

  const fillVendedor = () => {
    setEmail("vendedor@teste.com")
    setPassword("vendedor1234")
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <View style={styles.inner}>
        {/* Header */}
        <View style={styles.brandContainer}>
          <Text style={styles.brandBadge}>🍷 ADEGA CLOUD</Text>
          <Text style={styles.title}>Gestão & PDV Móvel</Text>
          <Text style={styles.subtitle}>
            Acesso inteligente adaptativo para Android & iOS
          </Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <Text style={styles.label}>E-MAIL DE ACESSO</Text>
          <TextInput
            style={styles.input}
            placeholder="ex: teste@teste.com"
            placeholderTextColor="#64748B"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>SENHA</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#64748B"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>ENTRAR NO SISTEMA</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Fast Fill Demo Buttons */}
        <View style={styles.demoSection}>
          <Text style={styles.demoTitle}>💡 ATALHOS DE TESTE RÁPIDO:</Text>
          <View style={styles.demoButtons}>
            <TouchableOpacity style={styles.demoBtnAdmin} onPress={fillAdmin}>
              <Text style={styles.demoBtnText}>👑 Entrar como DONO</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.demoBtnEmployee} onPress={fillVendedor}>
              <Text style={styles.demoBtnText}>🛒 Entrar como VENDEDOR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  inner: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  brandBadge: {
    backgroundColor: "#7C3AED22",
    color: "#A78BFA",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 12,
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#F8FAFC",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 24,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    marginBottom: 8,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#F8FAFC",
    fontSize: 15,
    marginBottom: 18,
  },
  loginButton: {
    backgroundColor: "#7C3AED",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  demoSection: {
    alignItems: "center",
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 12,
  },
  demoButtons: {
    flexDirection: "row",
    gap: 12,
  },
  demoBtnAdmin: {
    backgroundColor: "#1E1B4B",
    borderColor: "#6D28D9",
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  demoBtnEmployee: {
    backgroundColor: "#064E3B",
    borderColor: "#059669",
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  demoBtnText: {
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "600",
  },
})

import React, { useEffect, useState } from "react"
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Alert } from "react-native"
import { MobileApiService } from "../../services/MobileApiService"
import { CashRegisterSession } from "../../types"

export const CashRegisterScreen: React.FC = () => {
  const [session, setSession] = useState<CashRegisterSession | null>(null)
  const [sangriaAmount, setSangriaAmount] = useState("")

  useEffect(() => {
    MobileApiService.getCashSession().then(setSession)
  }, [])

  const handleSangria = () => {
    const val = parseFloat(sangriaAmount)
    if (!val || val <= 0) {
      Alert.alert("Atenção", "Informe um valor de sangria válido.")
      return
    }

    if (session && val > session.currentBalance) {
      Alert.alert("Saldo insuficiente", "O valor de sangria é maior que o saldo em caixa.")
      return
    }

    Alert.alert("Sangria Realizada! 💵", `Retirado R$ ${val.toFixed(2)} do caixa.`)
    setSangriaAmount("")
    if (session) {
      setSession({
        ...session,
        currentBalance: session.currentBalance - val,
        sangriaTotal: session.sangriaTotal + val,
      })
    }
  }

  if (!session) return null

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>💵 Caixa do Operador</Text>
      <Text style={styles.headerSub}>Abertura, sangria e conferência móvel</Text>

      {/* Primary Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>SALDO ATUAL EM GAVETA</Text>
        <Text style={styles.balanceVal}>
          R$ {session.currentBalance.toFixed(2)}
        </Text>

        <View style={styles.statusRow}>
          <Text style={styles.statusBadge}>🟢 CAIXA ABERTO ({session.openedAt})</Text>
        </View>
      </View>

      {/* Session Details */}
      <View style={styles.detailGrid}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>FUNDO INICIAL</Text>
          <Text style={styles.detailVal}>R$ {session.initialBalance.toFixed(2)}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>VENDAS DO TURNO</Text>
          <Text style={styles.detailValGreen}>R$ {session.salesTotal.toFixed(2)}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>TOTAL SANGRIA</Text>
          <Text style={styles.detailValRed}>R$ {session.sangriaTotal.toFixed(2)}</Text>
        </View>
      </View>

      {/* Sangria (Cash Drop) Form */}
      <View style={styles.cardForm}>
        <Text style={styles.formTitle}>💸 REALIZAR SANGRIA (RETIRADA)</Text>
        <Text style={styles.formSub}>Retire excesso de notas para o cofre ou banco</Text>

        <TextInput
          style={styles.input}
          placeholder="R$ 0,00"
          placeholderTextColor="#64748B"
          keyboardType="numeric"
          value={sangriaAmount}
          onChangeText={setSangriaAmount}
        />

        <TouchableOpacity style={styles.sangriaBtn} onPress={handleSangria}>
          <Text style={styles.sangriaBtnText}>CONFIRMAR SANGRIA DE CAIXA</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
    padding: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  headerSub: {
    fontSize: 13,
    color: "#94A3B8",
    marginBottom: 20,
  },
  balanceCard: {
    backgroundColor: "#1E1B4B",
    borderColor: "#6D28D9",
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#A78BFA",
    marginBottom: 6,
  },
  balanceVal: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: "row",
  },
  statusBadge: {
    backgroundColor: "#065F46",
    color: "#34D399",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  detailGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  detailItem: {
    flex: 1,
    backgroundColor: "#1E293B",
    borderColor: "#334155",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
    marginBottom: 4,
  },
  detailVal: {
    fontSize: 15,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  detailValGreen: {
    fontSize: 15,
    fontWeight: "800",
    color: "#10B981",
  },
  detailValRed: {
    fontSize: 15,
    fontWeight: "800",
    color: "#EF4444",
  },
  cardForm: {
    backgroundColor: "#1E293B",
    borderColor: "#334155",
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#F8FAFC",
    marginBottom: 4,
  },
  formSub: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 14,
  },
  input: {
    backgroundColor: "#0F172A",
    borderColor: "#334155",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 14,
  },
  sangriaBtn: {
    backgroundColor: "#DC2626",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  sangriaBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
})

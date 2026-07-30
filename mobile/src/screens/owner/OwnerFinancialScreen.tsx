import React, { useEffect, useState } from "react"
import { StyleSheet, Text, View, ScrollView, ActivityIndicator } from "react-native"
import { MobileApiService } from "../../services/MobileApiService"
import { FinancialSummary } from "../../types"

export const OwnerFinancialScreen: React.FC = () => {
  const [data, setData] = useState<FinancialSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    MobileApiService.getFinancial().then((res) => {
      setData(res)
      setLoading(false)
    })
  }, [])

  if (loading || !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>💰 Resumo Financeiro & Caixa</Text>
      <Text style={styles.headerSub}>Balanço acumulado da adega</Text>

      {/* Saldo de Caixa */}
      <View style={styles.cardHighlight}>
        <Text style={styles.cardLabel}>SALDO ATUAL EM CAIXA</Text>
        <Text style={styles.cardValue}>
          R$ {data.cashBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </Text>
      </View>

      {/* Hoje: A Pagar vs A Receber */}
      <View style={styles.row}>
        <View style={[styles.card, styles.cardRed]}>
          <Text style={styles.cardLabelRed}>CONTAS A PAGAR (HOJE)</Text>
          <Text style={styles.cardValueRed}>
            R$ {data.payablesToday.toFixed(2)}
          </Text>
        </View>
        <View style={[styles.card, styles.cardGreen]}>
          <Text style={styles.cardLabelGreen}>A RECEBER (HOJE)</Text>
          <Text style={styles.cardValueGreen}>
            R$ {data.receivablesToday.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Mês Vigente */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>FATURAMENTO DO MÊS</Text>
        <Text style={styles.monthVal}>
          R$ {data.monthRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </Text>
        <View style={styles.divider} />
        <Text style={styles.cardLabel}>LUCRO LÍQUIDO ESTIMADO</Text>
        <Text style={styles.profitVal}>
          R$ {data.monthProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </Text>
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
  center: {
    flex: 1,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
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
  cardHighlight: {
    backgroundColor: "#065F46",
    borderColor: "#10B981",
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 1,
    marginBottom: 6,
  },
  cardValue: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  card: {
    flex: 1,
    backgroundColor: "#1E293B",
    borderColor: "#334155",
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  cardRed: {
    borderColor: "#7F1D1D",
    backgroundColor: "#450A0A",
  },
  cardGreen: {
    borderColor: "#065F46",
    backgroundColor: "#064E3B",
  },
  cardLabelRed: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FCA5A5",
    marginBottom: 6,
  },
  cardValueRed: {
    fontSize: 20,
    fontWeight: "800",
    color: "#EF4444",
  },
  cardLabelGreen: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6EE7B7",
    marginBottom: 6,
  },
  cardValueGreen: {
    fontSize: 20,
    fontWeight: "800",
    color: "#10B981",
  },
  monthVal: {
    fontSize: 24,
    fontWeight: "800",
    color: "#F8FAFC",
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "#334155",
    marginVertical: 12,
  },
  profitVal: {
    fontSize: 24,
    fontWeight: "800",
    color: "#34D399",
  },
})

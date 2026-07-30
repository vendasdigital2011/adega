import React, { useEffect, useState } from "react"
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native"
import { MobileApiService } from "../../services/MobileApiService"
import { DashboardSummary } from "../../types"

interface Props {
  onNavigateTab: (tab: string) => void
}

export const OwnerDashboardScreen: React.FC<Props> = ({ onNavigateTab }) => {
  const [data, setData] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async () => {
    try {
      const res = await MobileApiService.getDashboard()
      setData(res)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading || !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor="#7C3AED" />}
    >
      <Text style={styles.headerTitle}>👑 Painel de Controle do Dono</Text>
      <Text style={styles.headerSub}>Visão executiva em tempo real</Text>

      {/* Primary KPI Card */}
      <View style={styles.primaryKpiCard}>
        <Text style={styles.kpiLabel}>FATURAMENTO DE HOJE</Text>
        <Text style={styles.kpiValue}>
          R$ {data.todayTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </Text>
        <View style={styles.badgeRow}>
          <Text style={styles.kpiSubBadge}>
            📦 {data.todayOrders} vendas concluídas
          </Text>
          <Text style={styles.kpiCompare}>
            vs R$ {data.yesterdayTotal.toFixed(2)} ontem
          </Text>
        </View>
      </View>

      {/* Secondary KPI Grid */}
      <View style={styles.grid}>
        <View style={styles.gridCard}>
          <Text style={styles.gridCardLabel}>TICKET MÉDIO</Text>
          <Text style={styles.gridCardValue}>
            R$ {data.ticketMedio.toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.gridCard, data.lowStockCount > 0 && styles.gridCardAlert]}
          onPress={() => onNavigateTab("alerts")}
        >
          <Text style={styles.gridCardLabel}>ESTOQUE CRÍTICO</Text>
          <Text style={[styles.gridCardValue, data.lowStockCount > 0 && styles.gridCardValueAlert]}>
            {data.lowStockCount} produtos
          </Text>
          <Text style={styles.clickHint}>Toque para ver ➔</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Action Navigation */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onNavigateTab("financial")}>
          <Text style={styles.actionBtnIcon}>💰</Text>
          <Text style={styles.actionBtnText}>Financeiro</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onNavigateTab("alerts")}>
          <Text style={styles.actionBtnIcon}>⚠️</Text>
          <Text style={styles.actionBtnText}>Alertas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onNavigateTab("audit")}>
          <Text style={styles.actionBtnIcon}>📋</Text>
          <Text style={styles.actionBtnText}>Auditoria</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Sales List */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>ÚLTIMAS VENDAS REALIZADAS</Text>
      </View>

      {data.recentSales.map((sale) => (
        <View key={sale.id} style={styles.saleItem}>
          <View style={styles.saleMainInfo}>
            <Text style={styles.saleCustomer}>{sale.customerName}</Text>
            <Text style={styles.saleMeta}>
              {sale.paymentMethod} • {sale.createdAt}
            </Text>
          </View>
          <Text style={styles.saleTotal}>
            R$ {sale.total.toFixed(2)}
          </Text>
        </View>
      ))}
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
  primaryKpiCard: {
    backgroundColor: "#1E1B4B",
    borderColor: "#6D28D9",
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#A78BFA",
    letterSpacing: 1,
    marginBottom: 6,
  },
  kpiValue: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  kpiSubBadge: {
    backgroundColor: "#312E81",
    color: "#C4B5FD",
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  kpiCompare: {
    fontSize: 12,
    color: "#94A3B8",
  },
  grid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  gridCard: {
    flex: 1,
    backgroundColor: "#1E293B",
    borderColor: "#334155",
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  gridCardAlert: {
    borderColor: "#DC2626",
    backgroundColor: "#450A0A",
  },
  gridCardLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    marginBottom: 6,
  },
  gridCardValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  gridCardValueAlert: {
    color: "#EF4444",
  },
  clickHint: {
    fontSize: 11,
    color: "#F87171",
    marginTop: 4,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  actionBtnIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  actionBtnText: {
    color: "#E2E8F0",
    fontSize: 12,
    fontWeight: "700",
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 1,
  },
  saleItem: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },
  saleMainInfo: {},
  saleCustomer: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  saleMeta: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  saleTotal: {
    fontSize: 16,
    fontWeight: "800",
    color: "#10B981",
  },
})

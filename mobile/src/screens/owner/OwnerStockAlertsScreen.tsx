import React, { useEffect, useState } from "react"
import { StyleSheet, Text, View, ScrollView, ActivityIndicator } from "react-native"
import { MobileApiService } from "../../services/MobileApiService"
import { StockAlert } from "../../types"

export const OwnerStockAlertsScreen: React.FC = () => {
  const [alerts, setAlerts] = useState<StockAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    MobileApiService.getStockAlerts().then((res) => {
      setAlerts(res)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>⚠️ Alertas de Estoque Mínimo</Text>
      <Text style={styles.headerSub}>Produtos que precisam de reposição urgente</Text>

      {alerts.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>✅ Todos os estoques estão normais!</Text>
        </View>
      ) : (
        alerts.map((item) => (
          <View
            key={item.id}
            style={[
              styles.card,
              item.status === "CRITICAL" ? styles.cardCritical : styles.cardWarning,
            ]}
          >
            <View style={styles.badgeRow}>
              <Text
                style={[
                  styles.badge,
                  item.status === "CRITICAL" ? styles.badgeCritical : styles.badgeWarning,
                ]}
              >
                {item.status === "CRITICAL" ? "🔴 CRÍTICO" : "🟡 ATENÇÃO"}
              </Text>
              <Text style={styles.sku}>SKU: {item.sku}</Text>
            </View>

            <Text style={styles.productName}>{item.name}</Text>

            <View style={styles.stockRow}>
              <Text style={styles.stockLabel}>Estoque Atual: </Text>
              <Text style={styles.stockVal}>{item.currentStock} un</Text>
              <Text style={styles.stockMinLabel}> (Mínimo: {item.minStock} un)</Text>
            </View>
          </View>
        ))
      )}
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
  emptyCard: {
    backgroundColor: "#1E293B",
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  emptyText: {
    color: "#10B981",
    fontSize: 16,
    fontWeight: "700",
  },
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardCritical: {
    backgroundColor: "#450A0A",
    borderColor: "#DC2626",
  },
  cardWarning: {
    backgroundColor: "#451A03",
    borderColor: "#D97706",
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  badge: {
    fontSize: 11,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  badgeCritical: {
    backgroundColor: "#991B1B",
    color: "#FCA5A5",
  },
  badgeWarning: {
    backgroundColor: "#78350F",
    color: "#FDE68A",
  },
  sku: {
    fontSize: 12,
    color: "#94A3B8",
  },
  productName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F8FAFC",
    marginBottom: 8,
  },
  stockRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  stockLabel: {
    color: "#CBD5E1",
    fontSize: 13,
  },
  stockVal: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  stockMinLabel: {
    color: "#94A3B8",
    fontSize: 13,
  },
})

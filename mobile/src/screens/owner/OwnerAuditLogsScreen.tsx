import React, { useEffect, useState } from "react"
import { StyleSheet, Text, View, ScrollView, ActivityIndicator } from "react-native"
import { MobileApiService } from "../../services/MobileApiService"
import { AuditLog } from "../../types"

export const OwnerAuditLogsScreen: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    MobileApiService.getAuditLogs().then((res) => {
      setLogs(res)
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
      <Text style={styles.headerTitle}>📋 Auditoria de Operações</Text>
      <Text style={styles.headerSub}>Histórico de sangrias, aberturas e alterações</Text>

      {logs.map((log) => (
        <View key={log.id} style={styles.logCard}>
          <View style={styles.topRow}>
            <Text style={styles.actionTag}>{log.action}</Text>
            <Text style={styles.timestamp}>{log.timestamp}</Text>
          </View>

          <Text style={styles.userText}>👤 Operador: {log.user}</Text>
          <Text style={styles.detailsText}>{log.details}</Text>
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
  logCard: {
    backgroundColor: "#1E293B",
    borderColor: "#334155",
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  actionTag: {
    backgroundColor: "#312E81",
    color: "#A78BFA",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  timestamp: {
    fontSize: 12,
    color: "#64748B",
  },
  userText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F8FAFC",
    marginBottom: 4,
  },
  detailsText: {
    fontSize: 13,
    color: "#94A3B8",
  },
})

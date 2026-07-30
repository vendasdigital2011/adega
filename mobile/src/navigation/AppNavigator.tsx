import React, { useState } from "react"
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Modal } from "react-native"
import { User, Product } from "../types"
import { MobileAuthService } from "../services/MobileAuthService"

import { OwnerDashboardScreen } from "../screens/owner/OwnerDashboardScreen"
import { OwnerFinancialScreen } from "../screens/owner/OwnerFinancialScreen"
import { OwnerStockAlertsScreen } from "../screens/owner/OwnerStockAlertsScreen"
import { OwnerAuditLogsScreen } from "../screens/owner/OwnerAuditLogsScreen"

import { POSMobileScreen } from "../screens/employee/POSMobileScreen"
import { CashRegisterScreen } from "../screens/employee/CashRegisterScreen"
import { StockSearchScreen } from "../screens/employee/StockSearchScreen"
import { BarcodeScannerScreen } from "../screens/employee/BarcodeScannerScreen"

interface AppNavigatorProps {
  user: User
  onLogout: () => void
}

export const AppNavigator: React.FC<AppNavigatorProps> = ({ user, onLogout }) => {
  const isOwner = user.role === "ADMIN"

  const [ownerTab, setOwnerTab] = useState<"dashboard" | "financial" | "alerts" | "audit">("dashboard")
  const [employeeTab, setEmployeeTab] = useState<"pos" | "cash" | "search">("pos")
  const [scannerVisible, setScannerVisible] = useState(false)
  const [scannedCallback, setScannedCallback] = useState<((p: Product) => void) | null>(null)

  const handleLogout = async () => {
    await MobileAuthService.signOut()
    onLogout()
  }

  const openScanner = (cb: (p: Product) => void) => {
    setScannedCallback(() => cb)
    setScannerVisible(true)
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Global Adaptive Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name}</Text>
          <View style={styles.roleRow}>
            <Text style={[styles.roleBadge, isOwner ? styles.roleOwner : styles.roleEmployee]}>
              {isOwner ? "👑 DONO" : "🛒 FUNCIONÁRIO"}
            </Text>
            <Text style={styles.companyName}>{user.companyName}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>SAIR 🚪</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>
        {isOwner ? (
          ownerTab === "dashboard" ? (
            <OwnerDashboardScreen onNavigateTab={(t: any) => setOwnerTab(t)} />
          ) : ownerTab === "financial" ? (
            <OwnerFinancialScreen />
          ) : ownerTab === "alerts" ? (
            <OwnerStockAlertsScreen />
          ) : (
            <OwnerAuditLogsScreen />
          )
        ) : employeeTab === "pos" ? (
          <POSMobileScreen onOpenScanner={openScanner} onNavigateTab={(t: any) => setEmployeeTab(t)} />
        ) : employeeTab === "cash" ? (
          <CashRegisterScreen />
        ) : (
          <StockSearchScreen />
        )}
      </View>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        {isOwner ? (
          <>
            <TouchableOpacity
              style={[styles.navBtn, ownerTab === "dashboard" && styles.navBtnActive]}
              onPress={() => setOwnerTab("dashboard")}
            >
              <Text style={styles.navIcon}>📊</Text>
              <Text style={[styles.navText, ownerTab === "dashboard" && styles.navTextActive]}>
                Painel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navBtn, ownerTab === "financial" && styles.navBtnActive]}
              onPress={() => setOwnerTab("financial")}
            >
              <Text style={styles.navIcon}>💰</Text>
              <Text style={[styles.navText, ownerTab === "financial" && styles.navTextActive]}>
                Financeiro
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navBtn, ownerTab === "alerts" && styles.navBtnActive]}
              onPress={() => setOwnerTab("alerts")}
            >
              <Text style={styles.navIcon}>⚠️</Text>
              <Text style={[styles.navText, ownerTab === "alerts" && styles.navTextActive]}>
                Alertas
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navBtn, ownerTab === "audit" && styles.navBtnActive]}
              onPress={() => setOwnerTab("audit")}
            >
              <Text style={styles.navIcon}>📋</Text>
              <Text style={[styles.navText, ownerTab === "audit" && styles.navTextActive]}>
                Auditoria
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.navBtn, employeeTab === "pos" && styles.navBtnActive]}
              onPress={() => setEmployeeTab("pos")}
            >
              <Text style={styles.navIcon}>🛒</Text>
              <Text style={[styles.navText, employeeTab === "pos" && styles.navTextActive]}>
                PDV Móvel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navBtn, employeeTab === "cash" && styles.navBtnActive]}
              onPress={() => setEmployeeTab("cash")}
            >
              <Text style={styles.navIcon}>💵</Text>
              <Text style={[styles.navText, employeeTab === "cash" && styles.navTextActive]}>
                Caixa
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navBtn, employeeTab === "search" && styles.navBtnActive]}
              onPress={() => setEmployeeTab("search")}
            >
              <Text style={styles.navIcon}>🔍</Text>
              <Text style={[styles.navText, employeeTab === "search" && styles.navTextActive]}>
                Estoque
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Barcode Scanner Modal */}
      <Modal visible={scannerVisible} animationType="slide">
        <BarcodeScannerScreen
          onClose={() => setScannerVisible(false)}
          onProductScanned={(prod) => {
            if (scannedCallback) scannedCallback(prod)
          }}
        />
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  topHeader: {
    backgroundColor: "#1E293B",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  userInfo: {},
  userName: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "800",
  },
  roleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  roleBadge: {
    fontSize: 10,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
  roleOwner: {
    backgroundColor: "#312E81",
    color: "#A78BFA",
  },
  roleEmployee: {
    backgroundColor: "#065F46",
    color: "#34D399",
  },
  companyName: {
    fontSize: 11,
    color: "#64748B",
  },
  logoutBtn: {
    backgroundColor: "#334155",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutBtnText: {
    color: "#CBD5E1",
    fontSize: 11,
    fontWeight: "700",
  },
  content: {
    flex: 1,
  },
  bottomNav: {
    backgroundColor: "#1E293B",
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#334155",
    paddingVertical: 8,
  },
  navBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
  },
  navBtnActive: {
    borderTopWidth: 2,
    borderTopColor: "#7C3AED",
  },
  navIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  navText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
  },
  navTextActive: {
    color: "#A78BFA",
  },
})

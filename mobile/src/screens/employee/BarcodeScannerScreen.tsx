import React, { useState } from "react"
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
} from "react-native"
import { MobileApiService } from "../../services/MobileApiService"
import { Product } from "../../types"

interface Props {
  onClose: () => void
  onProductScanned: (p: Product) => void
}

export const BarcodeScannerScreen: React.FC<Props> = ({ onClose, onProductScanned }) => {
  const [manualCode, setManualCode] = useState("")

  const handleSimulateScan = async (code: string) => {
    const p = await MobileApiService.findByBarcode(code)
    if (p) {
      onProductScanned(p)
      Alert.alert("Item Adicionado! 🍺", `${p.name} adicionado ao carrinho.`)
      onClose()
    } else {
      Alert.alert("Não Encontrado", `Nenhum produto cadastrado com o código ${code}.`)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📷 Leitor de Código de Barras</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>FECHAR ✖</Text>
        </TouchableOpacity>
      </View>

      {/* Simulated Viewfinder Target */}
      <View style={styles.viewfinderContainer}>
        <View style={styles.targetFrame}>
          <Text style={styles.targetText}>APONTE A CÂMERA PARA O CÓDIGO DE BARRAS DA GARRAFA / LATA</Text>
          <View style={styles.laserLine} />
        </View>
      </View>

      {/* Quick Test Barcode Buttons */}
      <View style={styles.quickScanCard}>
        <Text style={styles.quickScanTitle}>⚡ SIMULAR BIPAGEM DE PRODUTO:</Text>

        <TouchableOpacity
          style={styles.scanItemBtn}
          onPress={() => handleSimulateScan("7891234567890")}
        >
          <Text style={styles.scanItemText}>🍷 Bipar: Vinho Cabernet (7891234567890)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.scanItemBtn}
          onPress={() => handleSimulateScan("7891234567891")}
        >
          <Text style={styles.scanItemText}>🍺 Bipar: Cerveja IPA (7891234567891)</Text>
        </TouchableOpacity>

        <View style={styles.manualRow}>
          <TextInput
            style={styles.manualInput}
            placeholder="Digite o código manualmente..."
            placeholderTextColor="#64748B"
            keyboardType="numeric"
            value={manualCode}
            onChangeText={setManualCode}
          />
          <TouchableOpacity
            style={styles.manualBtn}
            onPress={() => handleSimulateScan(manualCode)}
          >
            <Text style={styles.manualBtnText}>BUSCAR</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090D16",
  },
  header: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1E293B",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  closeBtn: {
    backgroundColor: "#334155",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  closeBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  viewfinderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  targetFrame: {
    width: "100%",
    height: 200,
    borderWidth: 2,
    borderColor: "#10B981",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    position: "relative",
    backgroundColor: "rgba(16, 185, 129, 0.05)",
  },
  targetText: {
    color: "#A78BFA",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  laserLine: {
    position: "absolute",
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: "#EF4444",
  },
  quickScanCard: {
    backgroundColor: "#1E293B",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  quickScanTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#94A3B8",
    marginBottom: 12,
  },
  scanItemBtn: {
    backgroundColor: "#0F172A",
    borderColor: "#334155",
    borderWidth: 1,
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  scanItemText: {
    color: "#38BDF8",
    fontSize: 13,
    fontWeight: "700",
  },
  manualRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  manualInput: {
    flex: 1,
    backgroundColor: "#0F172A",
    borderColor: "#334155",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#FFFFFF",
    fontSize: 13,
  },
  manualBtn: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: "center",
  },
  manualBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
})

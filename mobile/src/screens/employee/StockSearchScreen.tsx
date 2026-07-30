import React, { useEffect, useState } from "react"
import { StyleSheet, Text, View, ScrollView, TextInput } from "react-native"
import { MobileApiService } from "../../services/MobileApiService"
import { Product } from "../../types"

export const StockSearchScreen: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [query, setQuery] = useState("")

  useEffect(() => {
    MobileApiService.searchProducts(query).then(setProducts)
  }, [query])

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>🔍 Consulta de Estoque & Preços</Text>
      <Text style={styles.headerSub}>Verifique a quantidade sem ir ao computador</Text>

      <TextInput
        style={styles.input}
        placeholder="Digite o nome, SKU ou código de barras..."
        placeholderTextColor="#64748B"
        value={query}
        onChangeText={setQuery}
      />

      <ScrollView style={styles.list}>
        {products.map((p) => (
          <View key={p.id} style={styles.card}>
            <View style={styles.mainInfo}>
              <Text style={styles.name}>{p.name}</Text>
              <Text style={styles.category}>{p.category} • SKU: {p.sku}</Text>
              <Text style={styles.barcode}>EAN: {p.barcode}</Text>
            </View>

            <View style={styles.rightContainer}>
              <Text style={styles.price}>R$ {p.price.toFixed(2)}</Text>
              <View
                style={[
                  styles.stockBadge,
                  p.stock <= p.minStock ? styles.stockBadgeLow : styles.stockBadgeOk,
                ]}
              >
                <Text style={styles.stockText}>{p.stock} {p.unit}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
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
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#1E293B",
    borderColor: "#334155",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#FFFFFF",
    fontSize: 14,
    marginBottom: 14,
  },
  list: {
    flex: 1,
  },
  card: {
    backgroundColor: "#1E293B",
    borderColor: "#334155",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mainInfo: {
    flex: 1,
    paddingRight: 10,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F8FAFC",
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    color: "#A78BFA",
    marginBottom: 2,
  },
  barcode: {
    fontSize: 11,
    color: "#64748B",
  },
  rightContainer: {
    alignItems: "flex-end",
  },
  price: {
    fontSize: 16,
    fontWeight: "800",
    color: "#10B981",
    marginBottom: 6,
  },
  stockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  stockBadgeOk: {
    backgroundColor: "#065F46",
  },
  stockBadgeLow: {
    backgroundColor: "#991B1B",
  },
  stockText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
})

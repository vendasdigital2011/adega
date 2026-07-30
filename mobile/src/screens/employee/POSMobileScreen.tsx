import React, { useEffect, useState } from "react"
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from "react-native"
import { MobileApiService } from "../../services/MobileApiService"
import { Product, CartItem } from "../../types"

interface Props {
  onOpenScanner: (onProductFound: (p: Product) => void) => void
  onNavigateTab: (tab: string) => void
}

export const POSMobileScreen: React.FC<Props> = ({ onOpenScanner, onNavigateTab }) => {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [paymentModalVisible, setPaymentModalVisible] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"Dinheiro" | "PIX" | "Cartão">("PIX")
  const [receivedCash, setReceivedCash] = useState("")

  useEffect(() => {
    MobileApiService.searchProducts(search).then(setProducts)
  }, [search])

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * product.price }
            : item
        )
      }
      return [...prev, { product, quantity: 1, subtotal: product.price }]
    })
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta
            return newQty > 0
              ? { ...item, quantity: newQty, subtotal: newQty * item.product.price }
              : null
          }
          return item
        })
        .filter(Boolean) as CartItem[]
    )
  }

  const cartTotal = cart.reduce((acc, item) => acc + item.subtotal, 0)
  const troco = Math.max(0, (parseFloat(receivedCash) || 0) - cartTotal)

  const handleCheckout = async () => {
    if (cart.length === 0) {
      Alert.alert("Carrinho vazio", "Adicione produtos antes de finalizar.")
      return
    }

    if (paymentMethod === "Dinheiro" && (parseFloat(receivedCash) || 0) < cartTotal) {
      Alert.alert("Valor insuficiente", "O valor recebido é menor que o total da venda.")
      return
    }

    try {
      await MobileApiService.registerSale(
        cart.map((c) => ({ productId: c.product.id, qty: c.quantity })),
        paymentMethod
      )

      Alert.alert("Venda Finalizada! 🎉", `Venda concluída no valor de R$ ${cartTotal.toFixed(2)}.`)
      setCart([])
      setPaymentModalVisible(false)
      setReceivedCash("")
    } catch {
      Alert.alert("Erro", "Não foi possível registrar a venda.")
    }
  }

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🛒 PDV Móvel Express</Text>
          <Text style={styles.headerSub}>Atendimento ágil no balcão & mesas</Text>
        </View>
        <TouchableOpacity style={styles.scannerBtn} onPress={() => onOpenScanner(addToCart)}>
          <Text style={styles.scannerBtnText}>📷 ESCANEAR</Text>
        </TouchableOpacity>
      </View>

      {/* Product Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar produto por nome, SKU ou binar..."
          placeholderTextColor="#64748B"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Product Catalog List */}
      <ScrollView style={styles.productList}>
        {products.map((product) => (
          <TouchableOpacity
            key={product.id}
            style={styles.productCard}
            onPress={() => addToCart(product)}
            activeOpacity={0.7}
          >
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.name}</Text>

              <View style={styles.productMetaRow}>
                <Text style={styles.productCategory}>{product.category}</Text>
                <Text style={styles.productStock}>Estoque: {product.stock} un</Text>
              </View>
            </View>

            <View style={styles.priceContainer}>
              <Text style={styles.productPrice}>R$ {product.price.toFixed(2)}</Text>
              <Text style={styles.addBtnText}>+ ADICIONAR</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bottom Cart Drawer */}
      {cart.length > 0 && (
        <View style={styles.cartFooter}>
          <View style={styles.cartHeaderRow}>
            <Text style={styles.cartTitle}>
              🛍️ Carrinho ({cart.reduce((acc, i) => acc + i.quantity, 0)} itens)
            </Text>
            <Text style={styles.cartTotalText}>Total: R$ {cartTotal.toFixed(2)}</Text>
          </View>

          <ScrollView horizontal style={styles.cartItemsScroll} showsHorizontalScrollIndicator={false}>
            {cart.map((item) => (
              <View key={item.product.id} style={styles.cartChip}>
                <Text style={styles.cartChipName} numberOfLines={1}>
                  {item.product.name}
                </Text>
                <View style={styles.qtyRow}>
                  <TouchableOpacity onPress={() => updateQuantity(item.product.id, -1)} style={styles.qtyBtn}>
                    <Text style={styles.qtyBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity onPress={() => updateQuantity(item.product.id, 1)} style={styles.qtyBtn}>
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.checkoutBtn}
            onPress={() => setPaymentModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.checkoutBtnText}>FINALIZAR VENDA (R$ {cartTotal.toFixed(2)})</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Payment Selection Modal */}
      <Modal visible={paymentModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Forma de Pagamento</Text>
            <Text style={styles.modalSub}>Total a pagar: R$ {cartTotal.toFixed(2)}</Text>

            <View style={styles.methodRow}>
              {(["PIX", "Cartão", "Dinheiro"] as const).map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.methodBtn,
                    paymentMethod === method && styles.methodBtnActive,
                  ]}
                  onPress={() => setPaymentMethod(method)}
                >
                  <Text
                    style={[
                      styles.methodText,
                      paymentMethod === method && styles.methodTextActive,
                    ]}
                  >
                    {method === "PIX" ? "⚡ PIX" : method === "Cartão" ? "💳 CARTÃO" : "💵 DINHEIRO"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {paymentMethod === "Dinheiro" && (
              <View style={styles.cashCalcSection}>
                <Text style={styles.cashLabel}>VALOR RECEBIDO DO CLIENTE (R$):</Text>
                <TextInput
                  style={styles.cashInput}
                  placeholder="0.00"
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                  value={receivedCash}
                  onChangeText={setReceivedCash}
                />
                <Text style={styles.trocoText}>
                  Troco a devolver: R$ {troco.toFixed(2)}
                </Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setPaymentModalVisible(false)}
              >
                <Text style={styles.cancelModalText}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmModalBtn} onPress={handleCheckout}>
                <Text style={styles.confirmModalText}>CONFIRMAR VENDA</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  header: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  headerSub: {
    fontSize: 12,
    color: "#94A3B8",
  },
  scannerBtn: {
    backgroundColor: "#059669",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  scannerBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  searchContainer: {
    padding: 12,
  },
  searchInput: {
    backgroundColor: "#1E293B",
    borderColor: "#334155",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#F8FAFC",
    fontSize: 14,
  },
  productList: {
    flex: 1,
    paddingHorizontal: 12,
  },
  productCard: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#334155",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productInfo: {
    flex: 1,
    paddingRight: 10,
  },
  productName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F8FAFC",
    marginBottom: 4,
  },
  productMetaRow: {
    flexDirection: "row",
    gap: 10,
  },
  productCategory: {
    fontSize: 12,
    color: "#A78BFA",
  },
  productStock: {
    fontSize: 12,
    color: "#64748B",
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "800",
    color: "#10B981",
    marginBottom: 4,
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#7C3AED",
  },
  cartFooter: {
    backgroundColor: "#1E293B",
    borderTopWidth: 1,
    borderTopColor: "#334155",
    padding: 16,
  },
  cartHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cartTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  cartTotalText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#10B981",
  },
  cartItemsScroll: {
    marginBottom: 12,
  },
  cartChip: {
    backgroundColor: "#0F172A",
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#334155",
    maxWidth: 140,
  },
  cartChipName: {
    color: "#E2E8F0",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  qtyBtn: {
    backgroundColor: "#334155",
    width: 24,
    height: 24,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  qtyText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  checkoutBtn: {
    backgroundColor: "#10B981",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  checkoutBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#1E293B",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  modalSub: {
    fontSize: 14,
    color: "#10B981",
    fontWeight: "700",
    marginBottom: 20,
  },
  methodRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  methodBtn: {
    flex: 1,
    backgroundColor: "#0F172A",
    borderColor: "#334155",
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  methodBtnActive: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
  },
  methodText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
  },
  methodTextActive: {
    color: "#FFFFFF",
  },
  cashCalcSection: {
    marginBottom: 20,
  },
  cashLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    marginBottom: 6,
  },
  cashInput: {
    backgroundColor: "#0F172A",
    borderColor: "#334155",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
  },
  trocoText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#34D399",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelModalBtn: {
    flex: 1,
    backgroundColor: "#334155",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelModalText: {
    color: "#CBD5E1",
    fontWeight: "700",
  },
  confirmModalBtn: {
    flex: 2,
    backgroundColor: "#10B981",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  confirmModalText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
})

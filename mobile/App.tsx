import React, { useEffect, useState } from "react"
import { StyleSheet, View, ActivityIndicator, StatusBar } from "react-native"
import { MobileAuthService } from "./src/services/MobileAuthService"
import { User } from "./src/types"
import { LoginScreen } from "./src/screens/LoginScreen"
import { AppNavigator } from "./src/navigation/AppNavigator"

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    MobileAuthService.getCurrentUser().then((u) => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <View style={styles.splash}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    )
  }

  if (!user) {
    return <LoginScreen onLoginSuccess={(u) => setUser(u)} />
  }

  return <AppNavigator user={user} onLogout={() => setUser(null)} />
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
  },
})

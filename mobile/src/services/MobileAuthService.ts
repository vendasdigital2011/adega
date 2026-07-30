import AsyncStorage from "@react-native-async-storage/async-storage"
import { User } from "../types"

const MOCK_ADMIN: User = {
  id: "u-admin",
  name: "Administrador / Dono",
  email: "teste@teste.com",
  role: "ADMIN",
  roleName: "Proprietário / Gestor",
  companyName: "Adega Modelo Cloud",
}

const MOCK_VENDEDOR: User = {
  id: "u-vendedor",
  name: "Vendedor Balcão",
  email: "vendedor@teste.com",
  role: "VENDEDOR",
  roleName: "Operador de PDV Móvel",
  companyName: "Adega Modelo Cloud",
}

const SESSION_KEY = "@adega_mobile_user"

export class MobileAuthService {
  public static async signIn(email: string, pass: string): Promise<User> {
    const cleanEmail = email.trim().toLowerCase()
    const cleanPass = pass.trim()

    if (cleanEmail === "teste@teste.com" && cleanPass === "teste1234") {
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(MOCK_ADMIN))
      return MOCK_ADMIN
    }

    if (cleanEmail === "vendedor@teste.com" && cleanPass === "vendedor1234") {
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(MOCK_VENDEDOR))
      return MOCK_VENDEDOR
    }

    throw new Error("E-mail ou senha inválidos. Verifique suas credenciais.")
  }

  public static async getCurrentUser(): Promise<User | null> {
    try {
      const data = await AsyncStorage.getItem(SESSION_KEY)
      if (!data) return null
      return JSON.parse(data) as User
    } catch {
      return null
    }
  }

  public static async signOut(): Promise<void> {
    await AsyncStorage.removeItem(SESSION_KEY)
  }
}

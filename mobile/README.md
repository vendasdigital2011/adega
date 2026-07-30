# 📱 Adega Cloud Mobile — App Android & iOS

Aplicativo móvel de alta performance em **React Native / Expo** com **Arquitetura Dinâmica de Dupla Visão**:

1. 👑 **Modo Dono / Gestor (Owner App):**
   - Faturamento em tempo real, ticket médio e comparação com dias anteriores.
   - Resumo financeiro de caixa, contas a pagar, a receber e lucro estimado.
   - Alertas de estoque crítico e produtos com reposição urgente.
   - Timeline de auditoria de operações dos funcionários (sangrias, aberturas).

2. 🛒 **Modo Funcionário / Operacional (Employee App):**
   - **PDV Móvel Express:** Realizar vendas ágeis diretamente nas mesas ou corredor.
   - **Leitor de Código de Barras via Câmera:** Bipar garrafas/latas com foco automático.
   - **Calculadora de Troco e Pagamento:** Suporte a PIX, Cartão e Dinheiro com troco dinâmico.
   - **Caixa Móvel:** Registro de sangrias e controle de fundo de caixa.
   - **Consulta de Estoque:** Busca instantânea por SKU, nome ou EAN.

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js >= 18
- Expo Go instalado no smartphone (opcional) ou emulador Android Studio / Xcode.

### Passo 1: Instalar dependências
```bash
cd mobile
npm install
```

### Passo 2: Iniciar o dev server do Expo
```bash
npm start
```

- Pressione `a` no terminal para abrir no **Emulador Android**.
- Pressione `i` no terminal para abrir no **Simulador iOS**.
- Ou escaneie o código QR com o aplicativo **Expo Go** no celular.

---

## 🔑 Credenciais de Teste Adaptativo

| Perfil | E-mail | Senha | Visão Carregada |
| :--- | :--- | :--- | :--- |
| **Dono / Proprietário** | `teste@teste.com` | `teste1234` | 👑 Dashboards, Finanças, Alertas e Auditoria |
| **Funcionário / Operador** | `vendedor@teste.com` | `vendedor1234` | 🛒 PDV Móvel, Leitor Câmera e Sangria |

---

## 📦 Como Gerar os Binários para Lojas (Play Store & App Store)

### Gerar APK / AAB para Android:
```bash
npx eas build -p android --profile preview
```

### Gerar IPA para iOS / TestFlight:
```bash
npx eas build -p ios --profile preview
```

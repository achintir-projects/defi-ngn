# 💰 DeFi NGN - Nigerian DeFi Platform

A modern, production-ready DeFi platform designed for the Nigerian market, featuring multi-wallet support, token management, and seamless blockchain integration.

## ✨ Platform Features

### 🏦 Core DeFi Functionality
- **💳 Multi-Wallet Support**: Connect with MetaMask, Trust Wallet, Bybit, Phantom, and Coinbase
- **🔗 Network Configuration**: Easy setup for custom blockchain networks
- **💱 Token Management**: Support for USDT (ERC20/TRC20), ETH, and custom tokens
- **📊 Transaction History**: Complete transaction tracking and management
- **💎 Token Injection**: Admin-controlled token distribution with custom pricing

### 🎯 Wallet Integration
- **🔐 Secure Connections**: Industry-standard wallet connection protocols
- **🌐 Custom Network**: Pre-configured network settings (Chain ID: 1337)
- **📱 Mobile-Friendly**: Optimized for both desktop and mobile wallet apps
- **🔄 Real-time Updates**: Live balance updates and transaction status

### 👨‍💼 Admin Dashboard
- **📈 Token Management**: Configure and manage all supported tokens
- **💰 Token Injection**: Distribute tokens to any wallet address
- **👥 User Management**: Monitor and manage user wallets
- **🔧 System Configuration**: Full control over platform settings

## ✨ Technology Stack

This scaffold provides a robust foundation built with:

### 🎯 Core Framework
- **⚡ Next.js 15** - The React framework for production with App Router
- **📘 TypeScript 5** - Type-safe JavaScript for better developer experience
- **🎨 Tailwind CSS 4** - Utility-first CSS framework for rapid UI development

### 🧩 UI Components & Styling
- **🧩 shadcn/ui** - High-quality, accessible components built on Radix UI
- **🎯 Lucide React** - Beautiful & consistent icon library
- **🌈 Framer Motion** - Production-ready motion library for React
- **🎨 Next Themes** - Perfect dark mode in 2 lines of code

### 📋 Forms & Validation
- **🎣 React Hook Form** - Performant forms with easy validation
- **✅ Zod** - TypeScript-first schema validation

### 🔄 State Management & Data Fetching
- **🐻 Zustand** - Simple, scalable state management
- **🔄 TanStack Query** - Powerful data synchronization for React
- **🌐 Axios** - Promise-based HTTP client

### 🗄️ Database & Backend
- **🗄️ Prisma** - Next-generation Node.js and TypeScript ORM
- **🔐 NextAuth.js** - Complete open-source authentication solution

### 🎨 Advanced UI Features
- **📊 TanStack Table** - Headless UI for building tables and datagrids
- **🖱️ DND Kit** - Modern drag and drop toolkit for React
- **📊 Recharts** - Redefined chart library built with React and D3
- **🖼️ Sharp** - High performance image processing

### 🌍 Internationalization & Utilities
- **🌍 Next Intl** - Internationalization library for Next.js
- **📅 Date-fns** - Modern JavaScript date utility library
- **🪝 ReactUse** - Collection of essential React hooks for modern development

## 🎯 Why This Scaffold?

- **🏎️ Fast Development** - Pre-configured tooling and best practices
- **🎨 Beautiful UI** - Complete shadcn/ui component library with advanced interactions
- **🔒 Type Safety** - Full TypeScript configuration with Zod validation
- **📱 Responsive** - Mobile-first design principles with smooth animations
- **🗄️ Database Ready** - Prisma ORM configured for rapid backend development
- **🔐 Auth Included** - NextAuth.js for secure authentication flows
- **📊 Data Visualization** - Charts, tables, and drag-and-drop functionality
- **🌍 i18n Ready** - Multi-language support with Next Intl
- **🚀 Production Ready** - Optimized build and deployment settings
- **🤖 AI-Friendly** - Structured codebase perfect for AI assistance

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Set up the database
npm run db:push

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Deployment

#### Netlify Deployment
This project is pre-configured for Netlify deployment:

1. **Connect to Netlify**:
   - Go to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository
   - Select the `defi-ngn` repository

2. **Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: 18

3. **Environment Variables** (if needed):
   - Add any required environment variables in Netlify settings

The project includes `netlify.toml` with optimized configuration for Next.js deployment.

#### Manual Deployment
```bash
# Build the project
npm run build

# Deploy to any static hosting service
# The .next directory contains the built application
```

### Access Points
- **Main Application**: [http://localhost:3000](http://localhost:3000)
- **Admin Dashboard**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **API Health Check**: [http://localhost:3000/api/health](http://localhost:3000/api/health)

## 🌐 Network Configuration

The platform uses a custom blockchain network configuration:

- **Chain ID**: 1337 (0x539)
- **Network Name**: Custom Network
- **Native Currency**: CETH
- **RPC URL**: http://127.0.0.1:8545

### Supported Wallets
- **MetaMask**: Browser extension wallet
- **Trust Wallet**: Mobile wallet with browser extension
- **Bybit**: Crypto exchange wallet
- **Phantom**: Solana ecosystem wallet
- **Coinbase**: Mainstream crypto wallet

## 💱 Supported Tokens

| Token | Type | Forced Price | Market Price |
|-------|------|---------------|--------------|
| USDT | ERC20 | $2.00 | $1.00 |
| USDT_TRC20 | TRC20 | $2.00 | $1.00 |
| ETH | NATIVE | $3,500 | $3,000 |
| CUSTOM | ERC20 | $10.00 | $0.10 |

## 🔧 Technology Stack

### 🎯 Core Framework
- **⚡ Next.js 15** - The React framework for production with App Router
- **📘 TypeScript 5** - Type-safe JavaScript for better developer experience
- **🎨 Tailwind CSS 4** - Utility-first CSS framework for rapid UI development

### 🧩 UI Components & Styling
- **🧩 shadcn/ui** - High-quality, accessible components built on Radix UI
- **🎯 Lucide React** - Beautiful & consistent icon library
- **🎨 Framer Motion** - Production-ready motion library for React
- **🌈 Next Themes** - Perfect dark mode in 2 lines of code

### 🗄️ Database & Backend
- **🗄️ Prisma** - Next-generation Node.js and TypeScript ORM
- **🔐 NextAuth.js** - Complete open-source authentication solution
- **🔌 Socket.io** - Real-time bidirectional event-based communication

### 🔄 State Management & Data Fetching
- **🐻 Zustand** - Simple, scalable state management
- **🔄 TanStack Query** - Powerful data synchronization for React
- **🌐 Axios** - Promise-based HTTP client

### 🎨 Advanced UI Features
- **📊 TanStack Table** - Headless UI for building tables and datagrids
- **🖱️ DND Kit** - Modern drag and drop toolkit for React
- **📊 Recharts** - Redefined chart library built with React and D3

## 🤝 Development & Deployment

### 📁 Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── admin/          # Admin dashboard pages
│   ├── api/            # API routes
│   └── globals.css     # Global styles
├── components/          # Reusable React components
│   ├── ui/             # shadcn/ui components
│   └── ...             # Custom components
├── hooks/              # Custom React hooks
└── lib/                # Utility functions and configurations
    ├── db.ts           # Database connection
    ├── networkService.ts  # Network configuration
    └── walletConnectionService.ts  # Wallet connection logic
```

### 🚀 Development Commands

```bash
# Development
npm run dev              # Start development server
npm run lint            # Run ESLint

# Database
npm run db:push         # Push schema to database
npm run db:generate     # Generate Prisma client
npm run db:migrate      # Run database migrations
npm run db:reset        # Reset database

# Production
npm run build          # Build for production
npm start              # Start production server
```

## 🤖 Powered by Z.ai

This platform is built with [Z.ai](https://chat.z.ai) - your AI assistant for:

- **💻 Code Generation** - Generate components, pages, and features instantly
- **🎨 UI Development** - Create beautiful interfaces with AI assistance  
- **🔧 Bug Fixing** - Identify and resolve issues with intelligent suggestions
- **📝 Documentation** - Auto-generate comprehensive documentation
- **🚀 Optimization** - Performance improvements and best practices

Ready to build something amazing? Start chatting with Z.ai at [chat.z.ai](https://chat.z.ai) and experience the future of AI-powered development!

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Built with ❤️ for the Nigerian DeFi community. Supercharged by [Z.ai](https://chat.z.ai) 🚀

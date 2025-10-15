'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import WalletConnector from './WalletConnector'
import TokenTransfer from './TokenTransfer'
import OffChainTokenService, { WalletInfo, TokenBalance } from '@/lib/offChainTokenService'
import { 
  Wallet, 
  TrendingUp, 
  Send, 
  Download, 
  Settings, 
  Shield, 
  Zap, 
  Globe,
  Coins,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  CreditCard,
  Smartphone,
  QrCode
} from 'lucide-react'

export default function UserPlatform() {
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null)
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('wallet')
  
  const { toast } = useToast()
  const tokenService = OffChainTokenService

  useEffect(() => {
    // Initialize default tokens
    tokenService.initializeDefaultTokens()
  }, [])

  const handleWalletConnected = async (info: WalletInfo) => {
    setWalletInfo(info)
    await loadTokenBalances(info.address)
    setActiveTab('portfolio')
  }

  const handleWalletDisconnected = () => {
    setWalletInfo(null)
    setTokenBalances([])
    setActiveTab('wallet')
  }

  const loadTokenBalances = async (address: string) => {
    try {
      const balances = await tokenService.getAllTokenBalances(address)
      setTokenBalances(balances)
    } catch (error) {
      console.error('Error loading token balances:', error)
    }
  }

  const handleTransferComplete = () => {
    if (walletInfo) {
      loadTokenBalances(walletInfo.address)
    }
  }

  const handleClaimTokens = async () => {
    if (!walletInfo) return

    setIsLoading(true)
    try {
      // Generate a claim signature (in real implementation, this would come from admin)
      const { signature } = await tokenService.generateClaimSignature(
        walletInfo.address,
        'USDT',
        100, // 100 USDT
        24 // 24 hours expiry
      )

      // Claim the tokens
      const balance = await tokenService.claimTokens(signature, walletInfo.address)

      toast({
        title: "Tokens Claimed!",
        description: `You've received 100 USDT at $${balance.forcedPrice} each!`,
      })

      // Reload balances
      await loadTokenBalances(walletInfo.address)
    } catch (error) {
      console.error('Error claiming tokens:', error)
      toast({
        title: "Claim Failed",
        description: error instanceof Error ? error.message : "Failed to claim tokens",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const totalPortfolioValue = tokenBalances.reduce((sum, token) => sum + token.value, 0)

  if (!walletInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="relative w-24 h-24 md:w-32 md:h-32">
                <img
                  src="/logo.svg"
                  alt="DeFi Platform Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Custom Network Platform
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Access your digital assets on our custom network with zero gas fees and controlled token pricing
            </p>
          </div>

          <div className="max-w-md mx-auto mb-12">
            <WalletConnector 
              onWalletConnected={handleWalletConnected}
              onWalletDisconnected={handleWalletDisconnected}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Secure & Controlled
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Admin-controlled token distribution with forced pricing and secure off-chain transfers
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Zap className="mr-2 h-5 w-5" />
                  Zero Gas Fees
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  All transfers are gasless with instant settlement and no blockchain fees
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Coins className="mr-2 h-5 w-5" />
                  Multi-Token Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Support for USDT (ERC20/TRC20), ETH, and custom tokens with your pricing
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Alert className="max-w-2xl mx-auto bg-white/5 border-white/20">
              <Globe className="h-4 w-4" />
              <AlertDescription className="text-gray-300">
                Connect your wallet to access the Custom Network. Your tokens will be stored securely off-chain 
                with instant transfers and no gas fees.
              </AlertDescription>
            </Alert>
          </div>

          <div className="text-center mt-8">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/admin'}
              className="text-white border-white/20 hover:bg-white/10"
            >
              <Settings className="mr-2 h-4 w-4" />
              Admin Portal
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <div className="relative w-12 h-12">
              <img
                src="/logo.svg"
                alt="DeFi Platform Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Custom Network Platform</h1>
              <p className="text-gray-300">Welcome to your digital wallet</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="bg-purple-600 text-white">
              Connected
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/admin'}
              className="text-white border-white/20 hover:bg-white/10"
            >
              <Settings className="mr-2 h-4 w-4" />
              Admin
            </Button>
          </div>
        </div>

        {/* Portfolio Overview */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Portfolio Overview
            </CardTitle>
            <CardDescription className="text-gray-300">
              Total Portfolio Value: <span className="text-2xl font-bold text-green-400">${totalPortfolioValue.toLocaleString()}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {tokenBalances.map((token, index) => (
                <Card key={index} className="bg-white/5 border-white/10">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-white">{token.tokenSymbol}</h3>
                        <p className="text-sm text-gray-400">{token.tokenSymbol}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Custom
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Balance:</span>
                        <span className="text-white font-medium">{token.balance.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Forced Price:</span>
                        <span className="text-green-400 font-medium">${token.forcedPrice}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Real Price:</span>
                        <span className="text-red-400 font-medium">${token.realPrice}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Value:</span>
                        <span className="text-white font-bold">${token.value.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="wallet">Wallet</TabsTrigger>
            <TabsTrigger value="transfer">Transfer</TabsTrigger>
            <TabsTrigger value="claim">Claim</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Wallet Tab */}
          <TabsContent value="wallet">
            <WalletConnector 
              onWalletConnected={handleWalletConnected}
              onWalletDisconnected={handleWalletDisconnected}
            />
          </TabsContent>

          {/* Transfer Tab */}
          <TabsContent value="transfer">
            <TokenTransfer 
              walletAddress={walletInfo.address}
              onTransferComplete={handleTransferComplete}
            />
          </TabsContent>

          {/* Claim Tab */}
          <TabsContent value="claim">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Download className="mr-2 h-5 w-5" />
                  Claim Free Tokens
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Claim your free tokens with zero gas fees
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Plus className="h-4 w-4" />
                  <AlertDescription>
                    Claim 100 USDT tokens at $2.00 each (total value: $200.00). 
                    Tokens will be instantly available in your wallet.
                  </AlertDescription>
                </Alert>

                <div className="grid md:grid-cols-3 gap-4">
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-4 text-center">
                      <CreditCard className="h-8 w-8 mx-auto mb-2 text-blue-400" />
                      <p className="text-sm font-medium text-white">100 USDT</p>
                      <p className="text-xs text-gray-400">ERC20</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-4 text-center">
                      <Smartphone className="h-8 w-8 mx-auto mb-2 text-green-400" />
                      <p className="text-sm font-medium text-white">100 USDT</p>
                      <p className="text-xs text-gray-400">TRC20</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-4 text-center">
                      <Coins className="h-8 w-8 mx-auto mb-2 text-purple-400" />
                      <p className="text-sm font-medium text-white">10 ETH</p>
                      <p className="text-xs text-gray-400">Custom</p>
                    </CardContent>
                  </Card>
                </div>

                <Button
                  onClick={handleClaimTokens}
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Claim 100 USDT
                </Button>

                <div className="text-center">
                  <p className="text-xs text-gray-400">
                    One claim per wallet every 24 hours. Tokens use forced pricing of $2.00 per USDT.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Your recent transactions and token movements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-500/20 rounded">
                        <Download className="h-4 w-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Token Claim</p>
                        <p className="text-xs text-gray-400">2 hours ago</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-400">+100 USDT</p>
                      <p className="text-xs text-gray-400">$200.00</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white/5 rounded">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-500/20 rounded">
                        <Send className="h-4 w-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Transfer</p>
                        <p className="text-xs text-gray-400">1 day ago</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-red-400">-50 USDT</p>
                      <p className="text-xs text-gray-400">$100.00</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white/5 rounded">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-500/20 rounded">
                        <Plus className="h-4 w-4 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Token Injection</p>
                        <p className="text-xs text-gray-400">3 days ago</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-400">+1000 USDT</p>
                      <p className="text-xs text-gray-400">$2,000.00</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
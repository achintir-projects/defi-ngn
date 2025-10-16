'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { 
  Users, 
  Wallet, 
  Coins, 
  TrendingUp, 
  Settings, 
  Plus, 
  Download, 
  Upload,
  Shield,
  LogOut,
  Activity,
  Database,
  Link as LinkIcon
} from 'lucide-react'

interface WalletWithBalance {
  address: string
  type: string
  chain: string
  isConnected: boolean
  connectionMethod: string
  balances: TokenBalance[]
}

interface TokenBalance {
  tokenSymbol: string
  balance: number
  forcedPrice: number
  realPrice: number
  value: number
}

interface TokenConfig {
  symbol: string
  name: string
  description: string
  type: string
  forcedPrice: number
  realPrice: number
  decimals: number
  contractAddress?: string
}

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(false)
  const [wallets, setWallets] = useState<WalletWithBalance[]>([])
  const [tokens, setTokens] = useState<TokenConfig[]>([])
  const [showInjectDialog, setShowInjectDialog] = useState(false)
  const [showWalletDialog, setShowWalletDialog] = useState(false)
  const [injectForm, setInjectForm] = useState({
    walletAddress: '',
    tokenSymbol: '',
    amount: '',
    forcedPrice: ''
  })
  const [walletForm, setWalletForm] = useState({
    address: '',
    type: 'manual',
    connectionMethod: 'manual'
  })
  
  const { toast } = useToast()

  useEffect(() => {
    checkAuth()
    loadData()
  }, [])

  const checkAuth = () => {
    const auth = localStorage.getItem('admin_auth')
    if (!auth) {
      window.location.href = '/admin/login'
      return
    }
    
    try {
      const authData = JSON.parse(auth)
      if (!authData.isAuthenticated || Date.now() - authData.timestamp > 24 * 60 * 60 * 1000) {
        localStorage.removeItem('admin_auth')
        window.location.href = '/admin/login'
      }
    } catch (error) {
      window.location.href = '/admin/login'
    }
  }

  const loadData = async () => {
    try {
      setIsLoading(true)
      
      // First, initialize default tokens if they don't exist
      try {
        const initResponse = await fetch('/api/admin/tokens', {
          method: 'POST'
        })
        await initResponse.json() // We don't need to check the response, just initialize
      } catch (error) {
        console.log('Tokens might already be initialized')
      }
      
      // Load all wallets with balances
      const walletsResponse = await fetch('/api/admin/wallet')
      const walletsData = await walletsResponse.json()
      
      if (walletsData.success) {
        setWallets(walletsData.wallets)
      }
      
      // Load token configurations
      const tokensResponse = await fetch('/api/admin/tokens')
      const tokensData = await tokensResponse.json()
      
      if (tokensData.success) {
        setTokens(tokensData.tokens)
      }
      
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInjectTokens = async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/admin/inject-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: injectForm.walletAddress,
          tokenSymbol: injectForm.tokenSymbol,
          amount: injectForm.amount,
          forcedPrice: injectForm.forcedPrice
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Tokens Injected",
          description: `Successfully injected ${injectForm.amount} ${injectForm.tokenSymbol} to wallet`,
        })
        
        setShowInjectDialog(false)
        setInjectForm({ walletAddress: '', tokenSymbol: '', amount: '', forcedPrice: '' })
        loadData()
      } else {
        throw new Error(data.error || 'Failed to inject tokens')
      }
      
    } catch (error) {
      console.error('Error injecting tokens:', error)
      toast({
        title: "Injection Failed",
        description: error instanceof Error ? error.message : "Failed to inject tokens",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddWallet = async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/admin/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: walletForm.address,
          type: walletForm.type,
          connectionMethod: walletForm.connectionMethod
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Wallet Added",
          description: "Wallet successfully added to the system",
        })
        
        setShowWalletDialog(false)
        setWalletForm({ address: '', type: 'manual', connectionMethod: 'manual' })
        loadData()
      } else {
        throw new Error(data.error || 'Failed to add wallet')
      }
      
    } catch (error) {
      console.error('Error adding wallet:', error)
      toast({
        title: "Failed to Add Wallet",
        description: error instanceof Error ? error.message : "Could not add wallet to system",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveWallet = async (address: string) => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/admin/wallet', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Wallet Removed",
          description: "Wallet successfully removed from the system",
        })
        
        loadData()
      } else {
        throw new Error(data.error || 'Failed to remove wallet')
      }
      
    } catch (error) {
      console.error('Error removing wallet:', error)
      toast({
        title: "Failed to Remove Wallet",
        description: error instanceof Error ? error.message : "Could not remove wallet from system",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnectWallet = async (address: string) => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/admin/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: address,
          type: 'manual',
          connectionMethod: 'manual'
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Wallet Connected",
          description: "Wallet status updated to connected",
        })
        
        loadData()
      } else {
        throw new Error(data.error || 'Failed to connect wallet')
      }
      
    } catch (error) {
      console.error('Error connecting wallet:', error)
      toast({
        title: "Failed to Connect Wallet",
        description: error instanceof Error ? error.message : "Could not connect wallet",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_auth')
    window.location.href = '/admin/login'
  }

  const getTotalValue = () => {
    return wallets.reduce((total, wallet) => {
      const walletTotal = wallet.balances.reduce((sum, balance) => sum + balance.value, 0)
      return total + walletTotal
    }, 0)
  }

  const getTotalWallets = () => wallets.length

  const getTotalTransactions = () => {
    // This would come from your transaction database
    return wallets.reduce((total, wallet) => total + wallet.balances.length, 0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-300">Manage your off-chain token system</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Wallet className="h-8 w-8 text-blue-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-300">Total Wallets</p>
                  <p className="text-2xl font-bold text-white">{getTotalWallets()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Coins className="h-8 w-8 text-green-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-300">Total Value</p>
                  <p className="text-2xl font-bold text-white">${getTotalValue().toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-purple-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-300">Transactions</p>
                  <p className="text-2xl font-bold text-white">{getTotalTransactions()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Database className="h-8 w-8 text-orange-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-300">Token Types</p>
                  <p className="text-2xl font-bold text-white">{tokens.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="wallets" className="space-y-6">
          <TabsList className="bg-white/10 border-white/20">
            <TabsTrigger value="wallets" className="text-white">
              <Wallet className="mr-2 h-4 w-4" />
              Wallets
            </TabsTrigger>
            <TabsTrigger value="tokens" className="text-white">
              <Coins className="mr-2 h-4 w-4" />
              Tokens
            </TabsTrigger>
            <TabsTrigger value="actions" className="text-white">
              <Settings className="mr-2 h-4 w-4" />
              Actions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="wallets">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Connected Wallets</CardTitle>
                    <CardDescription className="text-gray-300">
                      Manage all wallets connected to your platform
                    </CardDescription>
                  </div>
                  <Dialog open={showWalletDialog} onOpenChange={setShowWalletDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Wallet
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Wallet</DialogTitle>
                        <DialogDescription>
                          Manually add a wallet to the system
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-white mb-2 block">Wallet Address</label>
                          <Input
                            placeholder="0x..."
                            value={walletForm.address}
                            onChange={(e) => setWalletForm({...walletForm, address: e.target.value})}
                            className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-white mb-2 block">Wallet Type</label>
                          <select
                            value={walletForm.type}
                            onChange={(e) => setWalletForm({...walletForm, type: e.target.value})}
                            className="w-full p-2 bg-gray-800 border border-gray-600 text-white rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="manual" className="bg-gray-800">Manual</option>
                            <option value="metamask" className="bg-gray-800">MetaMask</option>
                            <option value="trustwallet" className="bg-gray-800">Trust Wallet</option>
                            <option value="bybit" className="bg-gray-800">Bybit</option>
                            <option value="phantom" className="bg-gray-800">Phantom</option>
                          </select>
                        </div>
                        <Button onClick={handleAddWallet} disabled={isLoading}>
                          Add Wallet
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {wallets.map((wallet) => (
                    <div key={wallet.address} className="p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{wallet.type}</Badge>
                          <Badge variant="secondary">{wallet.chain}</Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={wallet.isConnected ? "default" : "destructive"}>
                            {wallet.isConnected ? "Connected" : "Disconnected"}
                          </Badge>
                          {!wallet.isConnected && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleConnectWallet(wallet.address)}
                            >
                              <LinkIcon className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemoveWallet(wallet.address)}
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{wallet.address}</p>
                      <div className="space-y-1">
                        {wallet.balances.map((balance, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span className="text-white">{balance.tokenSymbol}</span>
                            <span className="text-green-400">
                              {balance.balance.toLocaleString()} (${balance.value.toLocaleString()})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tokens">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Token Configurations</CardTitle>
                <CardDescription className="text-gray-300">
                  Manage token types and their configurations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {tokens.map((token) => (
                    <div key={token.symbol} className="p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="text-white font-medium">{token.name} ({token.symbol})</h3>
                          <p className="text-sm text-gray-300">{token.description}</p>
                        </div>
                        <Badge variant="outline">{token.type}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Forced Price</p>
                          <p className="text-white">${token.forcedPrice}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Real Price</p>
                          <p className="text-white">${token.realPrice}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Admin Actions</CardTitle>
                <CardDescription className="text-gray-300">
                  Perform administrative tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    These actions require administrator privileges and will affect the entire system.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Inject Tokens */}
                  <Dialog open={showInjectDialog} onOpenChange={setShowInjectDialog}>
                    <DialogTrigger asChild>
                      <Card className="bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer transition-colors">
                        <CardContent className="p-6 text-center">
                          <Download className="h-8 w-8 text-green-400 mx-auto mb-2" />
                          <h3 className="text-white font-medium">Inject Tokens</h3>
                          <p className="text-sm text-gray-300">Add tokens to any wallet</p>
                        </CardContent>
                      </Card>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Inject Tokens</DialogTitle>
                        <DialogDescription>
                          Add tokens to a specific wallet address
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-white mb-2 block">Wallet Address</label>
                          <Input
                            placeholder="0x..."
                            value={injectForm.walletAddress}
                            onChange={(e) => setInjectForm({...injectForm, walletAddress: e.target.value})}
                            className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-white mb-2 block">Token Symbol</label>
                          <select
                            value={injectForm.tokenSymbol}
                            onChange={(e) => setInjectForm({...injectForm, tokenSymbol: e.target.value})}
                            className="w-full p-2 bg-gray-800 border border-gray-600 text-white rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="" className="bg-gray-800">Select token</option>
                            {tokens.map((token) => (
                              <option key={token.symbol} value={token.symbol} className="bg-gray-800">
                                {token.symbol}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-white mb-2 block">Amount</label>
                          <Input
                            type="number"
                            placeholder="1000"
                            value={injectForm.amount}
                            onChange={(e) => setInjectForm({...injectForm, amount: e.target.value})}
                            className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-white mb-2 block">Forced Price ($)</label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="2.00"
                            value={injectForm.forcedPrice}
                            onChange={(e) => setInjectForm({...injectForm, forcedPrice: e.target.value})}
                            className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <Button onClick={handleInjectTokens} disabled={isLoading}>
                          Inject Tokens
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Export Data */}
                  <Card className="bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer transition-colors">
                    <CardContent className="p-6 text-center">
                      <Upload className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                      <h3 className="text-white font-medium">Export Data</h3>
                      <p className="text-sm text-gray-300">Export system data</p>
                    </CardContent>
                  </Card>

                  {/* System Settings */}
                  <Card className="bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer transition-colors">
                    <CardContent className="p-6 text-center">
                      <Settings className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                      <h3 className="text-white font-medium">System Settings</h3>
                      <p className="text-sm text-gray-300">Configure system parameters</p>
                    </CardContent>
                  </Card>

                  {/* User Management */}
                  <Card className="bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer transition-colors">
                    <CardContent className="p-6 text-center">
                      <Users className="h-8 w-8 text-orange-400 mx-auto mb-2" />
                      <h3 className="text-white font-medium">User Management</h3>
                      <p className="text-sm text-gray-300">Manage platform users</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
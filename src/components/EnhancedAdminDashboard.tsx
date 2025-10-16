'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  Link as LinkIcon,
  Network,
  Code,
  DollarSign,
  BarChart3,
  Smartphone,
  Globe,
  Zap,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  QrCode,
  ExternalLink,
  Rocket,
  Target,
  Layers,
  PieChart,
  Copy
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

interface NetworkConfig {
  chainId: string
  chainName: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  rpcUrls: string[]
  blockExplorerUrls: string[]
}

interface DeployedContract {
  id: string
  address: string
  name: string
  symbol: string
  type: string
  decimals: number
  totalSupply: string
  deployer: string
  isActive: boolean
  createdAt: string
}

interface PushStatistics {
  totalPushes: number
  successfulPushes: number
  failedPushes: number
  pendingPushes: number
  totalValuePushed: number
  averagePushValue: number
  topTokens: Array<{
    symbol: string
    pushCount: number
    totalAmount: number
  }>
}

export default function EnhancedAdminDashboard() {
  const [isLoading, setIsLoading] = useState(false)
  const [wallets, setWallets] = useState<WalletWithBalance[]>([])
  const [tokens, setTokens] = useState<TokenConfig[]>([])
  const [contracts, setContracts] = useState<DeployedContract[]>([])
  const [networkConfig, setNetworkConfig] = useState<NetworkConfig | null>(null)
  const [pushStats, setPushStats] = useState<PushStatistics | null>(null)
  
  // Dialog states
  const [showInjectDialog, setShowInjectDialog] = useState(false)
  const [showDeployDialog, setShowDeployDialog] = useState(false)
  const [showWalletDialog, setShowWalletDialog] = useState(false)
  const [showPricingDialog, setShowPricingDialog] = useState(false)
  const [showAirdropDialog, setShowAirdropDialog] = useState(false)
  const [showNetworkDialog, setShowNetworkDialog] = useState(false)
  
  // Form states
  const [injectForm, setInjectForm] = useState({
    walletAddress: '',
    tokenSymbol: '',
    amount: '',
    forcedPrice: ''
  })
  
  const [deployForm, setDeployForm] = useState({
    name: '',
    symbol: '',
    type: 'ERC20',
    decimals: '18',
    initialSupply: '1000000',
    forcedPrice: '1.0'
  })
  
  const [walletForm, setWalletForm] = useState({
    address: '',
    type: 'manual',
    connectionMethod: 'manual'
  })
  
  const [pricingForm, setPricingForm] = useState({
    symbol: '',
    forcedPrice: '',
    realPrice: '',
    updateReason: ''
  })
  
  const [airdropForm, setAirdropForm] = useState({
    tokenSymbol: '',
    recipients: '',
    amount: ''
  })
  
  const [networkForm, setNetworkForm] = useState({
    chainName: 'Sepolia',
    chainId: '11155111',
    nativeCurrencyName: 'Sepolia Ether',
    nativeCurrencySymbol: 'SEP',
    nativeCurrencyDecimals: '18',
    rpcUrl: 'https://df-ngn.netlify.app/api/rpc',
    blockExplorerUrl: 'https://sepolia.etherscan.io'
  })
  
  const { toast } = useToast()

  useEffect(() => {
    checkAuth()
    loadAllData()
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

  const loadAllData = async () => {
    try {
      setIsLoading(true)
      
      // Load all data in parallel
      const [
        walletsData,
        tokensData,
        contractsData,
        networkData,
        pushStatsData
      ] = await Promise.all([
        fetch('/api/admin/wallet').then(r => r.json()),
        fetch('/api/admin/tokens').then(r => r.json()),
        fetch('/api/tokens/deploy?action=contracts').then(r => r.json()),
        fetch('/api/trustwallet/config').then(r => r.json()),
        fetch('/api/tokens/push?action=statistics').then(r => r.json())
      ])

      if (walletsData.success) setWallets(walletsData.wallets)
      if (tokensData.success) setTokens(tokensData.tokens)
      if (contractsData.success) setContracts(contractsData.contracts)
      if (networkData.success) setNetworkConfig(networkData.network)
      if (pushStatsData.success) setPushStats(pushStatsData.statistics)
      
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
      
      const response = await fetch('/api/tokens/inject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenSymbol: injectForm.tokenSymbol,
          amount: parseFloat(injectForm.amount),
          forcedPrice: parseFloat(injectForm.forcedPrice),
          targetWallets: [injectForm.walletAddress],
          isGasless: true,
          adminId: user?.id || 'admin'
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
        loadAllData()
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

  const handleDeployToken = async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/tokens/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'deploy',
          name: deployForm.name,
          symbol: deployForm.symbol,
          type: deployForm.type,
          decimals: parseInt(deployForm.decimals),
          initialSupply: parseFloat(deployForm.initialSupply),
          forcedPrice: parseFloat(deployForm.forcedPrice),
          deployerAddress: 'SYSTEM' // In real implementation, use actual admin address
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Token Deployed",
          description: `Successfully deployed ${deployForm.symbol} token`,
        })
        
        setShowDeployDialog(false)
        setDeployForm({
          name: '',
          symbol: '',
          type: 'ERC20',
          decimals: '18',
          initialSupply: '1000000',
          forcedPrice: '1.0'
        })
        loadAllData()
      } else {
        throw new Error(data.error || 'Failed to deploy token')
      }
      
    } catch (error) {
      console.error('Error deploying token:', error)
      toast({
        title: "Deployment Failed",
        description: error instanceof Error ? error.message : "Failed to deploy token",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdatePricing = async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updatePrice',
          symbol: pricingForm.symbol,
          forcedPrice: parseFloat(pricingForm.forcedPrice),
          realPrice: parseFloat(pricingForm.realPrice),
          updateReason: pricingForm.updateReason,
          updatedBy: 'admin'
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Price Updated",
          description: `Successfully updated pricing for ${pricingForm.symbol}`,
        })
        
        setShowPricingDialog(false)
        setPricingForm({ symbol: '', forcedPrice: '', realPrice: '', updateReason: '' })
        loadAllData()
      } else {
        throw new Error(data.error || 'Failed to update pricing')
      }
      
    } catch (error) {
      console.error('Error updating pricing:', error)
      toast({
        title: "Price Update Failed",
        description: error instanceof Error ? error.message : "Failed to update pricing",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAirdrop = async () => {
    try {
      setIsLoading(true)
      
      const recipients = airdropForm.recipients.split('\n').filter(line => line.trim()).map(line => {
        const [address, amount] = line.split(',').map(s => s.trim())
        return { address, amount: parseFloat(amount) || parseFloat(airdropForm.amount) }
      })
      
      const response = await fetch('/api/tokens/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'airdrop',
          tokenSymbol: airdropForm.tokenSymbol,
          recipients,
          airdropInitiator: 'admin',
          description: 'Admin airdrop'
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Airdrop Launched",
          description: `Successfully launched airdrop to ${recipients.length} wallets`,
        })
        
        setShowAirdropDialog(false)
        setAirdropForm({ tokenSymbol: '', recipients: '', amount: '' })
        loadAllData()
      } else {
        throw new Error(data.error || 'Failed to launch airdrop')
      }
      
    } catch (error) {
      console.error('Error launching airdrop:', error)
      toast({
        title: "Airdrop Failed",
        description: error instanceof Error ? error.message : "Failed to launch airdrop",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeployUSDT = async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/tokens/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'deployUSDT',
          deployerAddress: 'SYSTEM'
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "USDT Tokens Deployed",
          description: "Successfully deployed USDT ERC20 and TRC20 tokens",
        })
        loadAllData()
      } else {
        throw new Error(data.error || 'Failed to deploy USDT tokens')
      }
      
    } catch (error) {
      console.error('Error deploying USDT tokens:', error)
      toast({
        title: "Deployment Failed",
        description: error instanceof Error ? error.message : "Failed to deploy USDT tokens",
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
        loadAllData()
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
        loadAllData()
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
  const getTotalContracts = () => contracts.length
  const getTotalPushes = () => pushStats?.totalPushes || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Enhanced Admin Dashboard</h1>
            <p className="text-gray-300">Manage your DeFi NGN Network and token ecosystem</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={loadAllData} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
                <Code className="h-8 w-8 text-purple-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-300">Smart Contracts</p>
                  <p className="text-2xl font-bold text-white">{getTotalContracts()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Rocket className="h-8 w-8 text-orange-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-300">Token Pushes</p>
                  <p className="text-2xl font-bold text-white">{getTotalPushes()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white/10 border-white/20 grid w-full grid-cols-1 md:grid-cols-6">
            <TabsTrigger value="overview" className="text-white">
              <BarChart3 className="mr-2 h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="wallets" className="text-white">
              <Wallet className="mr-2 h-4 w-4" />
              Wallets
            </TabsTrigger>
            <TabsTrigger value="tokens" className="text-white">
              <Coins className="mr-2 h-4 w-4" />
              Tokens
            </TabsTrigger>
            <TabsTrigger value="contracts" className="text-white">
              <Code className="mr-2 h-4 w-4" />
              Contracts
            </TabsTrigger>
            <TabsTrigger value="network" className="text-white">
              <Network className="mr-2 h-4 w-4" />
              Network
            </TabsTrigger>
            <TabsTrigger value="actions" className="text-white">
              <Zap className="mr-2 h-4 w-4" />
              Actions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Network Status */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Globe className="mr-2 h-5 w-5" />
                    Network Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {networkConfig ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Chain Name</span>
                        <Badge variant="secondary">{networkConfig.chainName}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Chain ID</span>
                        <span className="text-white font-mono">{networkConfig.chainId}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Native Currency</span>
                        <span className="text-white">{networkConfig.nativeCurrency.name} ({networkConfig.nativeCurrency.symbol})</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">RPC URL</span>
                        <span className="text-white text-sm font-mono break-all">{networkConfig.rpcUrls[0]}</span>
                      </div>
                      <div className="pt-4">
                        <Button 
                          onClick={() => setShowNetworkDialog(true)}
                          className="w-full"
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Configure Network
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertTriangle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                      <p className="text-gray-300">Network configuration not available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Token Push Statistics */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Target className="mr-2 h-5 w-5" />
                    Token Push Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pushStats ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-400">{pushStats.successfulPushes}</p>
                          <p className="text-sm text-gray-300">Successful</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-red-400">{pushStats.failedPushes}</p>
                          <p className="text-sm text-gray-300">Failed</p>
                        </div>
                      </div>
                      <div className="border-t border-white/20 pt-4">
                        <p className="text-sm text-gray-300 mb-2">Total Value Pushed</p>
                        <p className="text-xl font-bold text-white">${pushStats.totalValuePushed.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-300 mb-2">Top Tokens</p>
                        <div className="space-y-1">
                          {pushStats.topTokens.slice(0, 3).map((token, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="text-white">{token.symbol}</span>
                              <span className="text-gray-300">{token.pushCount} pushes</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-300">No push statistics available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

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
                          {wallet.isConnected && (
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Connected
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveWallet(wallet.address)}
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="text-sm text-gray-300 font-mono break-all">
                        {wallet.address}
                      </div>
                      {wallet.balances.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {wallet.balances.map((balance, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="text-white">{balance.tokenSymbol}</span>
                              <span className="text-green-400">{balance.balance.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tokens">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Token Management</CardTitle>
                    <CardDescription className="text-gray-300">
                      Manage token configurations and pricing
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Dialog open={showPricingDialog} onOpenChange={setShowPricingDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <DollarSign className="mr-2 h-4 w-4" />
                          Update Pricing
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Update Token Pricing</DialogTitle>
                          <DialogDescription>
                            Update forced and real prices for tokens
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-white mb-2 block">Token Symbol</label>
                            <Select value={pricingForm.symbol} onValueChange={(value) => setPricingForm({...pricingForm, symbol: value})}>
                              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                                <SelectValue placeholder="Select token" />
                              </SelectTrigger>
                              <SelectContent>
                                {tokens.map((token) => (
                                  <SelectItem key={token.symbol} value={token.symbol}>
                                    {token.symbol}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-white mb-2 block">Forced Price ($)</label>
                            <Input
                              type="number"
                              step="0.01"
                              value={pricingForm.forcedPrice}
                              onChange={(e) => setPricingForm({...pricingForm, forcedPrice: e.target.value})}
                              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-white mb-2 block">Real Price ($)</label>
                            <Input
                              type="number"
                              step="0.01"
                              value={pricingForm.realPrice}
                              onChange={(e) => setPricingForm({...pricingForm, realPrice: e.target.value})}
                              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-white mb-2 block">Update Reason</label>
                            <Input
                              value={pricingForm.updateReason}
                              onChange={(e) => setPricingForm({...pricingForm, updateReason: e.target.value})}
                              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <Button onClick={handleUpdatePricing} disabled={isLoading}>
                            Update Pricing
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tokens.map((token) => (
                    <div key={token.symbol} className="p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-white">{token.symbol}</h3>
                        <Badge variant="outline">{token.type}</Badge>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{token.name}</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Forced Price:</span>
                          <span className="text-green-400">${token.forcedPrice}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Real Price:</span>
                          <span className="text-red-400">${token.realPrice}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Multiplier:</span>
                          <span className="text-yellow-400">{(token.forcedPrice / token.realPrice).toFixed(2)}x</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contracts">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Deployed Contracts</CardTitle>
                    <CardDescription className="text-gray-300">
                      Manage smart contracts deployed on the network
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Dialog open={showDeployDialog} onOpenChange={setShowDeployDialog}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          Deploy Token
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Deploy New Token</DialogTitle>
                          <DialogDescription>
                            Deploy a new token contract on the network
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-white mb-2 block">Token Name</label>
                            <Input
                              value={deployForm.name}
                              onChange={(e) => setDeployForm({...deployForm, name: e.target.value})}
                              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-white mb-2 block">Token Symbol</label>
                            <Input
                              value={deployForm.symbol}
                              onChange={(e) => setDeployForm({...deployForm, symbol: e.target.value})}
                              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-white mb-2 block">Token Type</label>
                            <Select value={deployForm.type} onValueChange={(value) => setDeployForm({...deployForm, type: value})}>
                              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ERC20">ERC20</SelectItem>
                                <SelectItem value="TRC20">TRC20</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-white mb-2 block">Decimals</label>
                              <Input
                                type="number"
                                value={deployForm.decimals}
                                onChange={(e) => setDeployForm({...deployForm, decimals: e.target.value})}
                                className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-white mb-2 block">Initial Supply</label>
                              <Input
                                type="number"
                                value={deployForm.initialSupply}
                                onChange={(e) => setDeployForm({...deployForm, initialSupply: e.target.value})}
                                className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-white mb-2 block">Forced Price ($)</label>
                            <Input
                              type="number"
                              step="0.01"
                              value={deployForm.forcedPrice}
                              onChange={(e) => setDeployForm({...deployForm, forcedPrice: e.target.value})}
                              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <Button onClick={handleDeployToken} disabled={isLoading}>
                            Deploy Token
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button onClick={handleDeployUSDT} disabled={isLoading} variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Deploy USDT
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {contracts.map((contract) => (
                    <div key={contract.id} className="p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-white">{contract.symbol}</h3>
                          <Badge variant="outline">{contract.type}</Badge>
                          {contract.isActive ? (
                            <Badge variant="default" className="bg-green-600">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{contract.name}</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Address:</span>
                          <span className="text-white font-mono text-xs break-all">{contract.address}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Decimals:</span>
                          <span className="text-white">{contract.decimals}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Supply:</span>
                          <span className="text-white">{contract.totalSupply}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Deployer:</span>
                          <span className="text-white font-mono text-xs">{contract.deployer}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="network">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Network Configuration</CardTitle>
                <CardDescription className="text-gray-300">
                  Configure the DeFi NGN Network settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {networkConfig ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Network Information</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Chain Name</span>
                            <span className="text-white">{networkConfig.chainName}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Chain ID</span>
                            <span className="text-white font-mono">{networkConfig.chainId}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Native Currency</span>
                            <span className="text-white">{networkConfig.nativeCurrency.name}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Currency Symbol</span>
                            <span className="text-white">{networkConfig.nativeCurrency.symbol}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Currency Decimals</span>
                            <span className="text-white">{networkConfig.nativeCurrency.decimals}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Endpoints</h3>
                        <div className="space-y-3">
                          <div>
                            <span className="text-gray-300 block mb-1">RPC URL</span>
                            <span className="text-white text-sm font-mono break-all bg-gray-800 p-2 rounded">{networkConfig.rpcUrls[0]}</span>
                          </div>
                          <div>
                            <span className="text-gray-300 block mb-1">Block Explorer</span>
                            <span className="text-white text-sm font-mono break-all bg-gray-800 p-2 rounded">{networkConfig.blockExplorerUrls[0]}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-white/20">
                      <h3 className="text-lg font-semibold text-white mb-4">Trust Wallet Integration</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button 
                          onClick={() => {
                            const config = JSON.stringify({
                              chainId: networkConfig.chainId,
                              chainName: networkConfig.chainName,
                              nativeCurrency: networkConfig.nativeCurrency,
                              rpcUrls: networkConfig.rpcUrls,
                              blockExplorerUrls: networkConfig.blockExplorerUrls
                            }, null, 2)
                            navigator.clipboard.writeText(config)
                            toast({ title: "Config Copied", description: "Network configuration copied to clipboard" })
                          }}
                          variant="outline"
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Config
                        </Button>
                        <Button 
                          onClick={() => {
                            const deepLink = `https://link.trustwallet.com/add_network?chainId=${networkConfig.chainId}&chainName=${encodeURIComponent(networkConfig.chainName)}&rpcUrl=${encodeURIComponent(networkConfig.rpcUrls[0])}&symbol=${networkConfig.nativeCurrency.symbol}&decimals=${networkConfig.nativeCurrency.decimals}&blockExplorerUrl=${encodeURIComponent(networkConfig.blockExplorerUrls[0])}`
                            window.open(deepLink, '_blank')
                          }}
                          variant="outline"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Trust Wallet Link
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Network className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-300">Network configuration not available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Token Injection */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Upload className="mr-2 h-5 w-5" />
                    Token Injection
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Inject tokens into user wallets
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Dialog open={showInjectDialog} onOpenChange={setShowInjectDialog}>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        Inject Tokens
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Inject Tokens</DialogTitle>
                        <DialogDescription>
                          Inject tokens into a specific wallet
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
                          <Select value={injectForm.tokenSymbol} onValueChange={(value) => setInjectForm({...injectForm, tokenSymbol: value})}>
                            <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                              <SelectValue placeholder="Select token" />
                            </SelectTrigger>
                            <SelectContent>
                              {tokens.map((token) => (
                                <SelectItem key={token.symbol} value={token.symbol}>
                                  {token.symbol}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-white mb-2 block">Amount</label>
                            <Input
                              type="number"
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
                              value={injectForm.forcedPrice}
                              onChange={(e) => setInjectForm({...injectForm, forcedPrice: e.target.value})}
                              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        <Button onClick={handleInjectTokens} disabled={isLoading}>
                          Inject Tokens
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              {/* Airdrop */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Rocket className="mr-2 h-5 w-5" />
                    Airdrop
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Launch token airdrops to multiple wallets
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Dialog open={showAirdropDialog} onOpenChange={setShowAirdropDialog}>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <Upload className="mr-2 h-4 w-4" />
                        Launch Airdrop
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Launch Token Airdrop</DialogTitle>
                        <DialogDescription>
                          Airdrop tokens to multiple wallet addresses
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-white mb-2 block">Token Symbol</label>
                          <Select value={airdropForm.tokenSymbol} onValueChange={(value) => setAirdropForm({...airdropForm, tokenSymbol: value})}>
                            <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                              <SelectValue placeholder="Select token" />
                            </SelectTrigger>
                            <SelectContent>
                              {tokens.map((token) => (
                                <SelectItem key={token.symbol} value={token.symbol}>
                                  {token.symbol}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-white mb-2 block">Recipients (one per line: address,amount)</label>
                          <textarea
                            placeholder="0x123...,100\
0x456...,200"
                            value={airdropForm.recipients}
                            onChange={(e) => setAirdropForm({...airdropForm, recipients: e.target.value})}
                            className="w-full h-32 p-2 bg-gray-800 border border-gray-600 text-white placeholder:text-gray-400 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <p className="text-xs text-gray-400 mt-1">Format: wallet_address,amount (leave amount empty to use default)</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-white mb-2 block">Default Amount</label>
                          <Input
                            type="number"
                            value={airdropForm.amount}
                            onChange={(e) => setAirdropForm({...airdropForm, amount: e.target.value})}
                            className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <Button onClick={handleAirdrop} disabled={isLoading}>
                          Launch Airdrop
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
}

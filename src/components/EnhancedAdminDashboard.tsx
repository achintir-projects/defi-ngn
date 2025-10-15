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
  PieChart
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
    chainName: 'DeFi NGN Network',
    chainId: '1337',
    nativeCurrencyName: 'Nigerian Ether',
    nativeCurrencySymbol: 'NGN',
    nativeCurrencyDecimals: '18',
    rpcUrl: 'https://df-ngn.netlify.app/api/rpc',
    blockExplorerUrl: 'https://explorer.defi-ngn.com'
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
  }\n\n  const handleLogout = () => {\n    localStorage.removeItem('admin_auth')\n    window.location.href = '/admin/login'\n  }\n\n  const getTotalValue = () => {\n    return wallets.reduce((total, wallet) => {\n      const walletTotal = wallet.balances.reduce((sum, balance) => sum + balance.value, 0)\n      return total + walletTotal\n    }, 0)\n  }\n\n  const getTotalWallets = () => wallets.length\n  const getTotalContracts = () => contracts.length\n  const getTotalPushes = () => pushStats?.totalPushes || 0\n\n  return (\n    <div className=\"min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4\">\n      <div className=\"max-w-7xl mx-auto\">\n        {/* Header */}\n        <div className=\"flex items-center justify-between mb-8\">\n          <div>\n            <h1 className=\"text-3xl font-bold text-white\">Enhanced Admin Dashboard</h1>\n            <p className=\"text-gray-300\">Manage your DeFi NGN Network and token ecosystem</p>\n          </div>\n          <div className=\"flex items-center space-x-4\">\n            <Button variant=\"outline\" onClick={loadAllData} disabled={isLoading}>\n              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />\n              Refresh\n            </Button>\n            <Button variant=\"outline\" onClick={handleLogout}>\n              <LogOut className=\"mr-2 h-4 w-4\" />\n              Logout\n            </Button>\n          </div>\n        </div>\n\n        {/* Stats Cards */}\n        <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8\">\n          <Card className=\"bg-white/10 backdrop-blur-sm border-white/20\">\n            <CardContent className=\"p-6\">\n              <div className=\"flex items-center\">\n                <Wallet className=\"h-8 w-8 text-blue-400\" />\n                <div className=\"ml-4\">\n                  <p className=\"text-sm font-medium text-gray-300\">Total Wallets</p>\n                  <p className=\"text-2xl font-bold text-white\">{getTotalWallets()}</p>\n                </div>\n              </div>\n            </CardContent>\n          </Card>\n\n          <Card className=\"bg-white/10 backdrop-blur-sm border-white/20\">\n            <CardContent className=\"p-6\">\n              <div className=\"flex items-center\">\n                <Coins className=\"h-8 w-8 text-green-400\" />\n                <div className=\"ml-4\">\n                  <p className=\"text-sm font-medium text-gray-300\">Total Value</p>\n                  <p className=\"text-2xl font-bold text-white\">${getTotalValue().toLocaleString()}</p>\n                </div>\n              </div>\n            </CardContent>\n          </Card>\n\n          <Card className=\"bg-white/10 backdrop-blur-sm border-white/20\">\n            <CardContent className=\"p-6\">\n              <div className=\"flex items-center\">\n                <Code className=\"h-8 w-8 text-purple-400\" />\n                <div className=\"ml-4\">\n                  <p className=\"text-sm font-medium text-gray-300\">Smart Contracts</p>\n                  <p className=\"text-2xl font-bold text-white\">{getTotalContracts()}</p>\n                </div>\n              </div>\n            </CardContent>\n          </Card>\n\n          <Card className=\"bg-white/10 backdrop-blur-sm border-white/20\">\n            <CardContent className=\"p-6\">\n              <div className=\"flex items-center\">\n                <Rocket className=\"h-8 w-8 text-orange-400\" />\n                <div className=\"ml-4\">\n                  <p className=\"text-sm font-medium text-gray-300\">Token Pushes</p>\n                  <p className=\"text-2xl font-bold text-white\">{getTotalPushes()}</p>\n                </div>\n              </div>\n            </CardContent>\n          </Card>\n        </div>\n\n        {/* Main Content */}\n        <Tabs defaultValue=\"overview\" className=\"space-y-6\">\n          <TabsList className=\"bg-white/10 border-white/20 grid w-full grid-cols-1 md:grid-cols-6\">\n            <TabsTrigger value=\"overview\" className=\"text-white\">\n              <BarChart3 className=\"mr-2 h-4 w-4\" />\n              Overview\n            </TabsTrigger>\n            <TabsTrigger value=\"wallets\" className=\"text-white\">\n              <Wallet className=\"mr-2 h-4 w-4\" />\n              Wallets\n            </TabsTrigger>\n            <TabsTrigger value=\"tokens\" className=\"text-white\">\n              <Coins className=\"mr-2 h-4 w-4\" />\n              Tokens\n            </TabsTrigger>\n            <TabsTrigger value=\"contracts\" className=\"text-white\">\n              <Code className=\"mr-2 h-4 w-4\" />\n              Contracts\n            </TabsTrigger>\n            <TabsTrigger value=\"network\" className=\"text-white\">\n              <Network className=\"mr-2 h-4 w-4\" />\n              Network\n            </TabsTrigger>\n            <TabsTrigger value=\"actions\" className=\"text-white\">\n              <Zap className=\"mr-2 h-4 w-4\" />\n              Actions\n            </TabsTrigger>\n          </TabsList>\n\n          <TabsContent value=\"overview\">\n            <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">\n              {/* Network Status */}\n              <Card className=\"bg-white/10 backdrop-blur-sm border-white/20\">\n                <CardHeader>\n                  <CardTitle className=\"text-white flex items-center\">\n                    <Globe className=\"mr-2 h-5 w-5\" />\n                    Network Status\n                  </CardTitle>\n                </CardHeader>\n                <CardContent>\n                  {networkConfig ? (\n                    <div className=\"space-y-4\">\n                      <div className=\"flex justify-between items-center\">\n                        <span className=\"text-gray-300\">Chain Name</span>\n                        <Badge variant=\"secondary\">{networkConfig.chainName}</Badge>\n                      </div>\n                      <div className=\"flex justify-between items-center\">\n                        <span className=\"text-gray-300\">Chain ID</span>\n                        <span className=\"text-white font-mono\">{networkConfig.chainId}</span>\n                      </div>\n                      <div className=\"flex justify-between items-center\">\n                        <span className=\"text-gray-300\">Native Currency</span>\n                        <span className=\"text-white\">{networkConfig.nativeCurrency.name} ({networkConfig.nativeCurrency.symbol})</span>\n                      </div>\n                      <div className=\"flex justify-between items-center\">\n                        <span className=\"text-gray-300\">RPC URL</span>\n                        <span className=\"text-white text-sm font-mono break-all\">{networkConfig.rpcUrls[0]}</span>\n                      </div>\n                      <div className=\"pt-4\">\n                        <Button \n                          onClick={() => setShowNetworkDialog(true)}\n                          className=\"w-full\"\n                        >\n                          <Settings className=\"mr-2 h-4 w-4\" />\n                          Configure Network\n                        </Button>\n                      </div>\n                    </div>\n                  ) : (\n                    <div className=\"text-center py-8\">\n                      <AlertTriangle className=\"h-12 w-12 text-yellow-400 mx-auto mb-4\" />\n                      <p className=\"text-gray-300\">Network configuration not available</p>\n                    </div>\n                  )}\n                </CardContent>\n              </Card>\n\n              {/* Token Push Statistics */}\n              <Card className=\"bg-white/10 backdrop-blur-sm border-white/20\">\n                <CardHeader>\n                  <CardTitle className=\"text-white flex items-center\">\n                    <Target className=\"mr-2 h-5 w-5\" />\n                    Token Push Statistics\n                  </CardTitle>\n                </CardHeader>\n                <CardContent>\n                  {pushStats ? (\n                    <div className=\"space-y-4\">\n                      <div className=\"grid grid-cols-2 gap-4\">\n                        <div className=\"text-center\">\n                          <p className=\"text-2xl font-bold text-green-400\">{pushStats.successfulPushes}</p>\n                          <p className=\"text-sm text-gray-300\">Successful</p>\n                        </div>\n                        <div className=\"text-center\">\n                          <p className=\"text-2xl font-bold text-red-400\">{pushStats.failedPushes}</p>\n                          <p className=\"text-sm text-gray-300\">Failed</p>\n                        </div>\n                      </div>\n                      <div className=\"border-t border-white/20 pt-4\">\n                        <p className=\"text-sm text-gray-300 mb-2\">Total Value Pushed</p>\n                        <p className=\"text-xl font-bold text-white\">${pushStats.totalValuePushed.toLocaleString()}</p>\n                      </div>\n                      <div>\n                        <p className=\"text-sm text-gray-300 mb-2\">Top Tokens</p>\n                        <div className=\"space-y-1\">\n                          {pushStats.topTokens.slice(0, 3).map((token, index) => (\n                            <div key={index} className=\"flex justify-between text-sm\">\n                              <span className=\"text-white\">{token.symbol}</span>\n                              <span className=\"text-gray-300\">{token.pushCount} pushes</span>\n                            </div>\n                          ))}\n                        </div>\n                      </div>\n                    </div>\n                  ) : (\n                    <div className=\"text-center py-8\">\n                      <PieChart className=\"h-12 w-12 text-gray-400 mx-auto mb-4\" />\n                      <p className=\"text-gray-300\">No push statistics available</p>\n                    </div>\n                  )}\n                </CardContent>\n              </Card>\n            </div>\n          </TabsContent>\n\n          <TabsContent value=\"wallets\">\n            <Card className=\"bg-white/10 backdrop-blur-sm border-white/20\">\n              <CardHeader>\n                <div className=\"flex items-center justify-between\">\n                  <div>\n                    <CardTitle className=\"text-white\">Connected Wallets</CardTitle>\n                    <CardDescription className=\"text-gray-300\">\n                      Manage all wallets connected to your platform\n                    </CardDescription>\n                  </div>\n                  <Dialog open={showWalletDialog} onOpenChange={setShowWalletDialog}>\n                    <DialogTrigger asChild>\n                      <Button>\n                        <Plus className=\"mr-2 h-4 w-4\" />\n                        Add Wallet\n                      </Button>\n                    </DialogTrigger>\n                    <DialogContent>\n                      <DialogHeader>\n                        <DialogTitle>Add New Wallet</DialogTitle>\n                        <DialogDescription>\n                          Manually add a wallet to the system\n                        </DialogDescription>\n                      </DialogHeader>\n                      <div className=\"space-y-4\">\n                        <div>\n                          <label className=\"text-sm font-medium text-white mb-2 block\">Wallet Address</label>\n                          <Input\n                            placeholder=\"0x...\"\n                            value={walletForm.address}\n                            onChange={(e) => setWalletForm({...walletForm, address: e.target.value})}\n                            className=\"bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent\"\n                          />\n                        </div>\n                        <Button onClick={handleAddWallet} disabled={isLoading}>\n                          Add Wallet\n                        </Button>\n                      </div>\n                    </DialogContent>\n                  </Dialog>\n                </div>\n              </CardHeader>\n              <CardContent>\n                <div className=\"space-y-4 max-h-96 overflow-y-auto\">\n                  {wallets.map((wallet) => (\n                    <div key={wallet.address} className=\"p-4 bg-white/5 rounded-lg\">\n                      <div className=\"flex items-center justify-between mb-2\">\n                        <div className=\"flex items-center space-x-2\">\n                          <Badge variant=\"outline\">{wallet.type}</Badge>\n                          <Badge variant=\"secondary\">{wallet.chain}</Badge>\n                          {wallet.isConnected && (\n                            <Badge variant=\"default\" className=\"bg-green-600\">\n                              <CheckCircle className=\"mr-1 h-3 w-3\" />\n                              Connected\n                            </Badge>\n                          )}\n                        </div>\n                        <Button\n                          variant=\"outline\"\n                          size=\"sm\"\n                          onClick={() => handleRemoveWallet(wallet.address)}\n                        >\n                          Remove\n                        </Button>\n                      </div>\n                      <div className=\"text-sm text-gray-300 font-mono break-all\">\n                        {wallet.address}\n                      </div>\n                      {wallet.balances.length > 0 && (\n                        <div className=\"mt-2 space-y-1\">\n                          {wallet.balances.map((balance, index) => (\n                            <div key={index} className=\"flex justify-between text-sm\">\n                              <span className=\"text-white\">{balance.tokenSymbol}</span>\n                              <span className=\"text-green-400\">{balance.balance.toLocaleString()}</span>\n                            </div>\n                          ))}\n                        </div>\n                      )}\n                    </div>\n                  ))}\n                </div>\n              </CardContent>\n            </Card>\n          </TabsContent>\n\n          <TabsContent value=\"tokens\">\n            <Card className=\"bg-white/10 backdrop-blur-sm border-white/20\">\n              <CardHeader>\n                <div className=\"flex items-center justify-between\">\n                  <div>\n                    <CardTitle className=\"text-white\">Token Management</CardTitle>\n                    <CardDescription className=\"text-gray-300\">\n                      Manage token configurations and pricing\n                    </CardDescription>\n                  </div>\n                  <div className=\"flex space-x-2\">\n                    <Dialog open={showPricingDialog} onOpenChange={setShowPricingDialog}>\n                      <DialogTrigger asChild>\n                        <Button variant=\"outline\">\n                          <DollarSign className=\"mr-2 h-4 w-4\" />\n                          Update Pricing\n                        </Button>\n                      </DialogTrigger>\n                      <DialogContent>\n                        <DialogHeader>\n                          <DialogTitle>Update Token Pricing</DialogTitle>\n                          <DialogDescription>\n                            Update forced and real prices for tokens\n                          </DialogDescription>\n                        </DialogHeader>\n                        <div className=\"space-y-4\">\n                          <div>\n                            <label className=\"text-sm font-medium text-white mb-2 block\">Token Symbol</label>\n                            <Select value={pricingForm.symbol} onValueChange={(value) => setPricingForm({...pricingForm, symbol: value})}>\n                              <SelectTrigger className=\"bg-gray-800 border-gray-600 text-white\">\n                                <SelectValue placeholder=\"Select token\" />\n                              </SelectTrigger>\n                              <SelectContent>\n                                {tokens.map((token) => (\n                                  <SelectItem key={token.symbol} value={token.symbol}>\n                                    {token.symbol}\n                                  </SelectItem>\n                                ))}\n                              </SelectContent>\n                            </Select>\n                          </div>\n                          <div>\n                            <label className=\"text-sm font-medium text-white mb-2 block\">Forced Price ($)</label>\n                            <Input\n                              type=\"number\"\n                              step=\"0.01\"\n                              value={pricingForm.forcedPrice}\n                              onChange={(e) => setPricingForm({...pricingForm, forcedPrice: e.target.value})}\n                              className=\"bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent\"\n                            />\n                          </div>\n                          <div>\n                            <label className=\"text-sm font-medium text-white mb-2 block\">Real Price ($)</label>\n                            <Input\n                              type=\"number\"\n                              step=\"0.01\"\n                              value={pricingForm.realPrice}\n                              onChange={(e) => setPricingForm({...pricingForm, realPrice: e.target.value})}\n                              className=\"bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent\"\n                            />\n                          </div>\n                          <div>\n                            <label className=\"text-sm font-medium text-white mb-2 block\">Update Reason</label>\n                            <Input\n                              value={pricingForm.updateReason}\n                              onChange={(e) => setPricingForm({...pricingForm, updateReason: e.target.value})}\n                              className=\"bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent\"\n                            />\n                          </div>\n                          <Button onClick={handleUpdatePricing} disabled={isLoading}>\n                            Update Pricing\n                          </Button>\n                        </div>\n                      </DialogContent>\n                    </Dialog>\n                  </div>\n                </div>\n              </CardHeader>\n              <CardContent>\n                <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4\">\n                  {tokens.map((token) => (\n                    <div key={token.symbol} className=\"p-4 bg-white/5 rounded-lg\">\n                      <div className=\"flex items-center justify-between mb-2\">\n                        <h3 className=\"font-semibold text-white\">{token.symbol}</h3>\n                        <Badge variant=\"outline\">{token.type}</Badge>\n                      </div>\n                      <p className=\"text-sm text-gray-300 mb-2\">{token.name}</p>\n                      <div className=\"space-y-1 text-sm\">\n                        <div className=\"flex justify-between\">\n                          <span className=\"text-gray-400\">Forced Price:</span>\n                          <span className=\"text-green-400\">${token.forcedPrice}</span>\n                        </div>\n                        <div className=\"flex justify-between\">\n                          <span className=\"text-gray-400\">Real Price:</span>\n                          <span className=\"text-red-400\">${token.realPrice}</span>\n                        </div>\n                        <div className=\"flex justify-between\">\n                          <span className=\"text-gray-400\">Multiplier:</span>\n                          <span className=\"text-yellow-400\">{(token.forcedPrice / token.realPrice).toFixed(2)}x</span>\n                        </div>\n                      </div>\n                    </div>\n                  ))}\n                </div>\n              </CardContent>\n            </Card>\n          </TabsContent>\n\n          <TabsContent value=\"contracts\">\n            <Card className=\"bg-white/10 backdrop-blur-sm border-white/20\">\n              <CardHeader>\n                <div className=\"flex items-center justify-between\">\n                  <div>\n                    <CardTitle className=\"text-white\">Deployed Contracts</CardTitle>\n                    <CardDescription className=\"text-gray-300\">\n                      Manage smart contracts deployed on the network\n                    </CardDescription>\n                  </div>\n                  <div className=\"flex space-x-2\">\n                    <Dialog open={showDeployDialog} onOpenChange={setShowDeployDialog}>\n                      <DialogTrigger asChild>\n                        <Button>\n                          <Plus className=\"mr-2 h-4 w-4\" />\n                          Deploy Token\n                        </Button>\n                      </DialogTrigger>\n                      <DialogContent>\n                        <DialogHeader>\n                          <DialogTitle>Deploy New Token</DialogTitle>\n                          <DialogDescription>\n                            Deploy a new token contract on the network\n                          </DialogDescription>\n                        </DialogHeader>\n                        <div className=\"space-y-4\">\n                          <div>\n                            <label className=\"text-sm font-medium text-white mb-2 block\">Token Name</label>\n                            <Input\n                              value={deployForm.name}\n                              onChange={(e) => setDeployForm({...deployForm, name: e.target.value})}\n                              className=\"bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent\"\n                            />\n                          </div>\n                          <div>\n                            <label className=\"text-sm font-medium text-white mb-2 block\">Token Symbol</label>\n                            <Input\n                              value={deployForm.symbol}\n                              onChange={(e) => setDeployForm({...deployForm, symbol: e.target.value})}\n                              className=\"bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent\"\n                            />\n                          </div>\n                          <div>\n                            <label className=\"text-sm font-medium text-white mb-2 block\">Token Type</label>\n                            <Select value={deployForm.type} onValueChange={(value) => setDeployForm({...deployForm, type: value})}>\n                              <SelectTrigger className=\"bg-gray-800 border-gray-600 text-white\">\n                                <SelectValue />\n                              </SelectTrigger>\n                              <SelectContent>\n                                <SelectItem value=\"ERC20\">ERC20</SelectItem>\n                                <SelectItem value=\"TRC20\">TRC20</SelectItem>\n                              </SelectContent>\n                            </Select>\n                          </div>\n                          <div className=\"grid grid-cols-2 gap-4\">\n                            <div>\n                              <label className=\"text-sm font-medium text-white mb-2 block\">Decimals</label>\n                              <Input\n                                type=\"number\"\n                                value={deployForm.decimals}\n                                onChange={(e) => setDeployForm({...deployForm, decimals: e.target.value})}\n                                className=\"bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent\"\n                              />\n                            </div>\n                            <div>\n                              <label className=\"text-sm font-medium text-white mb-2 block\">Initial Supply</label>\n                              <Input\n                                type=\"number\"\n                                value={deployForm.initialSupply}\n                                onChange={(e) => setDeployForm({...deployForm, initialSupply: e.target.value})}\n                                className=\"bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent\"\n                              />\n                            </div>\n                          </div>\n                          <div>\n                            <label className=\"text-sm font-medium text-white mb-2 block\">Forced Price ($)</label>\n                            <Input\n                              type=\"number\"\n                              step=\"0.01\"\n                              value={deployForm.forcedPrice}\n                              onChange={(e) => setDeployForm({...deployForm, forcedPrice: e.target.value})}\n                              className=\"bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent\"\n                            />\n                          </div>\n                          <Button onClick={handleDeployToken} disabled={isLoading}>\n                            Deploy Token\n                          </Button>\n                        </div>\n                      </DialogContent>\n                    </Dialog>\n                    <Button onClick={handleDeployUSDT} disabled={isLoading} variant=\"outline\">\n                      <Download className=\"mr-2 h-4 w-4\" />\n                      Deploy USDT\n                    </Button>\n                  </div>\n                </div>\n              </CardHeader>\n              <CardContent>\n                <div className=\"space-y-4 max-h-96 overflow-y-auto\">\n                  {contracts.map((contract) => (\n                    <div key={contract.id} className=\"p-4 bg-white/5 rounded-lg\">\n                      <div className=\"flex items-center justify-between mb-2\">\n                        <div className=\"flex items-center space-x-2\">\n                          <h3 className=\"font-semibold text-white\">{contract.symbol}</h3>\n                          <Badge variant=\"outline\">{contract.type}</Badge>\n                          {contract.isActive ? (\n                            <Badge variant=\"default\" className=\"bg-green-600\">Active</Badge>\n                          ) : (\n                            <Badge variant=\"secondary\">Inactive</Badge>\n                          )}\n                        </div>\n                      </div>\n                      <p className=\"text-sm text-gray-300 mb-2\">{contract.name}</p>\n                      <div className=\"space-y-1 text-sm\">\n                        <div className=\"flex justify-between\">\n                          <span className=\"text-gray-400\">Address:</span>\n                          <span className=\"text-white font-mono text-xs break-all\">{contract.address}</span>\n                        </div>\n                        <div className=\"flex justify-between\">\n                          <span className=\"text-gray-400\">Decimals:</span>\n                          <span className=\"text-white\">{contract.decimals}</span>\n                        </div>\n                        <div className=\"flex justify-between\">\n                          <span className=\"text-gray-400\">Total Supply:</span>\n                          <span className=\"text-white\">{contract.totalSupply}</span>\n                        </div>\n                        <div className=\"flex justify-between\">\n                          <span className=\"text-gray-400\">Deployer:</span>\n                          <span className=\"text-white font-mono text-xs\">{contract.deployer}</span>\n                        </div>\n                      </div>\n                    </div>\n                  ))}\n                </div>\n              </CardContent>\n            </Card>\n          </TabsContent>\n\n          <TabsContent value=\"network\">\n            <Card className=\"bg-white/10 backdrop-blur-sm border-white/20\">\n              <CardHeader>\n                <CardTitle className=\"text-white\">Network Configuration</CardTitle>\n                <CardDescription className=\"text-gray-300\">\n                  Configure the DeFi NGN Network settings\n                </CardDescription>\n              </CardHeader>\n              <CardContent>\n                {networkConfig ? (\n                  <div className=\"space-y-6\">\n                    <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">\n                      <div>\n                        <h3 className=\"text-lg font-semibold text-white mb-4\">Network Information</h3>\n                        <div className=\"space-y-3\">\n                          <div className=\"flex justify-between items-center\">\n                            <span className=\"text-gray-300\">Chain Name</span>\n                            <span className=\"text-white\">{networkConfig.chainName}</span>\n                          </div>\n                          <div className=\"flex justify-between items-center\">\n                            <span className=\"text-gray-300\">Chain ID</span>\n                            <span className=\"text-white font-mono\">{networkConfig.chainId}</span>\n                          </div>\n                          <div className=\"flex justify-between items-center\">\n                            <span className=\"text-gray-300\">Native Currency</span>\n                            <span className=\"text-white\">{networkConfig.nativeCurrency.name}</span>\n                          </div>\n                          <div className=\"flex justify-between items-center\">\n                            <span className=\"text-gray-300\">Currency Symbol</span>\n                            <span className=\"text-white\">{networkConfig.nativeCurrency.symbol}</span>\n                          </div>\n                          <div className=\"flex justify-between items-center\">\n                            <span className=\"text-gray-300\">Currency Decimals</span>\n                            <span className=\"text-white\">{networkConfig.nativeCurrency.decimals}</span>\n                          </div>\n                        </div>\n                      </div>\n                      \n                      <div>\n                        <h3 className=\"text-lg font-semibold text-white mb-4\">Endpoints</h3>\n                        <div className=\"space-y-3\">\n                          <div>\n                            <span className=\"text-gray-300 block mb-1\">RPC URL</span>\n                            <span className=\"text-white text-sm font-mono break-all bg-gray-800 p-2 rounded\">{networkConfig.rpcUrls[0]}</span>\n                          </div>\n                          <div>\n                            <span className=\"text-gray-300 block mb-1\">Block Explorer</span>\n                            <span className=\"text-white text-sm font-mono break-all bg-gray-800 p-2 rounded\">{networkConfig.blockExplorerUrls[0]}</span>\n                          </div>\n                        </div>\n                      </div>\n                    </div>\n                    \n                    <div className=\"pt-4 border-t border-white/20\">\n                      <h3 className=\"text-lg font-semibold text-white mb-4\">Trust Wallet Integration</h3>\n                      <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">\n                        <Button \n                          onClick={() => {\n                            const config = JSON.stringify({\n                              chainId: networkConfig.chainId,\n                              chainName: networkConfig.chainName,\n                              nativeCurrency: networkConfig.nativeCurrency,\n                              rpcUrls: networkConfig.rpcUrls,\n                              blockExplorerUrls: networkConfig.blockExplorerUrls\n                            }, null, 2)\n                            navigator.clipboard.writeText(config)\n                            toast({ title: "Config Copied", description: "Network configuration copied to clipboard" })\n                          }}\n                          variant=\"outline\"\n                        >\n                          <Copy className=\"mr-2 h-4 w-4\" />\n                          Copy Config\n                        </Button>\n                        <Button \n                          onClick={() => {\n                            const deepLink = `https://link.trustwallet.com/add_network?chainId=${networkConfig.chainId}&chainName=${encodeURIComponent(networkConfig.chainName)}&rpcUrl=${encodeURIComponent(networkConfig.rpcUrls[0])}&symbol=${networkConfig.nativeCurrency.symbol}&decimals=${networkConfig.nativeCurrency.decimals}&blockExplorerUrl=${encodeURIComponent(networkConfig.blockExplorerUrls[0])}`\n                            window.open(deepLink, '_blank')\n                          }}\n                          variant=\"outline\"\n                        >\n                          <ExternalLink className=\"mr-2 h-4 w-4\" />\n                          Trust Wallet Link\n                        </Button>\n                      </div>\n                    </div>\n                  </div>\n                ) : (\n                  <div className=\"text-center py-8\">\n                    <Network className=\"h-12 w-12 text-gray-400 mx-auto mb-4\" />\n                    <p className=\"text-gray-300\">Network configuration not available</p>\n                  </div>\n                )}\n              </CardContent>\n            </Card>\n          </TabsContent>\n\n          <TabsContent value=\"actions\">\n            <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">\n              {/* Token Injection */}\n              <Card className=\"bg-white/10 backdrop-blur-sm border-white/20\">\n                <CardHeader>\n                  <CardTitle className=\"text-white flex items-center\">\n                    <Upload className=\"mr-2 h-5 w-5\" />\n                    Token Injection\n                  </CardTitle>\n                  <CardDescription className=\"text-gray-300\">\n                    Inject tokens into user wallets\n                  </CardDescription>\n                </CardHeader>\n                <CardContent>\n                  <Dialog open={showInjectDialog} onOpenChange={setShowInjectDialog}>\n                    <DialogTrigger asChild>\n                      <Button className=\"w-full\">\n                        <Plus className=\"mr-2 h-4 w-4\" />\n                        Inject Tokens\n                      </Button>\n                    </DialogTrigger>\n                    <DialogContent>\n                      <DialogHeader>\n                        <DialogTitle>Inject Tokens</DialogTitle>\n                        <DialogDescription>\n                          Inject tokens into a specific wallet\n                        </DialogDescription>\n                      </DialogHeader>\n                      <div className=\"space-y-4\">\n                        <div>\n                          <label className=\"text-sm font-medium text-white mb-2 block\">Wallet Address</label>\n                          <Input\n                            placeholder=\"0x...\"\n                            value={injectForm.walletAddress}\n                            onChange={(e) => setInjectForm({...injectForm, walletAddress: e.target.value})}\n                            className=\"bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent\"\n                          />\n                        </div>\n                        <div>\n                          <label className=\"text-sm font-medium text-white mb-2 block\">Token Symbol</label>\n                          <Select value={injectForm.tokenSymbol} onValueChange={(value) => setInjectForm({...injectForm, tokenSymbol: value})}>\n                            <SelectTrigger className=\"bg-gray-800 border-gray-600 text-white\">\n                              <SelectValue placeholder=\"Select token\" />\n                            </SelectTrigger>\n                            <SelectContent>\n                              {tokens.map((token) => (\n                                <SelectItem key={token.symbol} value={token.symbol}>\n                                  {token.symbol}\n                                </SelectItem>\n                              ))}\n                            </SelectContent>\n                          </Select>\n                        </div>\n                        <div className=\"grid grid-cols-2 gap-4\">\n                          <div>\n                            <label className=\"text-sm font-medium text-white mb-2 block\">Amount</label>\n                            <Input\n                              type=\"number\"\n                              value={injectForm.amount}\n                              onChange={(e) => setInjectForm({...injectForm, amount: e.target.value})}\n                              className=\"bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent\"\n                            />\n                          </div>\n                          <div>\n                            <label className=\"text-sm font-medium text-white mb-2 block\">Forced Price ($)</label>\n                            <Input\n                              type=\"number\"\n                              step=\"0.01\"\n                              value={injectForm.forcedPrice}\n                              onChange={(e) => setInjectForm({...injectForm, forcedPrice: e.target.value})}\n                              className=\"bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent\"\n                            />\n                          </div>\n                        </div>\n                        <Button onClick={handleInjectTokens} disabled={isLoading}>\n                          Inject Tokens\n                        </Button>\n                      </div>\n                    </DialogContent>\n                  </Dialog>\n                </CardContent>\n              </Card>\n\n              {/* Airdrop */}\n              <Card className=\"bg-white/10 backdrop-blur-sm border-white/20\">\n                <CardHeader>\n                  <CardTitle className=\"text-white flex items-center\">\n                    <Rocket className=\"mr-2 h-5 w-5\" />\n                    Airdrop\n                  </CardTitle>\n                  <CardDescription className=\"text-gray-300\">\n                    Launch token airdrops to multiple wallets\n                  </CardDescription>\n                </CardHeader>\n                <CardContent>\n                  <Dialog open={showAirdropDialog} onOpenChange={setShowAirdropDialog}>\n                    <DialogTrigger asChild>\n                      <Button className=\"w-full\">\n                        <Upload className=\"mr-2 h-4 w-4\" />\n                        Launch Airdrop\n                      </Button>\n                    </DialogTrigger>\n                    <DialogContent className=\"max-w-2xl\">\n                      <DialogHeader>\n                        <DialogTitle>Launch Token Airdrop</DialogTitle>\n                        <DialogDescription>\n                          Airdrop tokens to multiple wallet addresses\n                        </DialogDescription>\n                      </DialogHeader>\n                      <div className=\"space-y-4\">\n                        <div>\n                          <label className=\"text-sm font-medium text-white mb-2 block\">Token Symbol</label>\n                          <Select value={airdropForm.tokenSymbol} onValueChange={(value) => setAirdropForm({...airdropForm, tokenSymbol: value})}>\n                            <SelectTrigger className=\"bg-gray-800 border-gray-600 text-white\">\n                              <SelectValue placeholder=\"Select token\" />\n                            </SelectTrigger>\n                            <SelectContent>\n                              {tokens.map((token) => (\n                                <SelectItem key={token.symbol} value={token.symbol}>\n                                  {token.symbol}\n                                </SelectItem>\n                              ))}\n                            </SelectContent>\n                          </Select>\n                        </div>\n                        <div>\n                          <label className=\"text-sm font-medium text-white mb-2 block\">Recipients (one per line: address,amount)</label>\n                          <textarea\n                            placeholder=\"0x123...,100\\n0x456...,200\"\n                            value={airdropForm.recipients}\n                            onChange={(e) => setAirdropForm({...airdropForm, recipients: e.target.value})}\n                            className=\"w-full h-32 p-2 bg-gray-800 border border-gray-600 text-white placeholder:text-gray-400 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent\"\n                          />\n                          <p className=\"text-xs text-gray-400 mt-1\">Format: wallet_address,amount (leave amount empty to use default)</p>\n                        </div>\n                        <div>\n                          <label className=\"text-sm font-medium text-white mb-2 block\">Default Amount</label>\n                          <Input\n                            type=\"number\"\n                            value={airdropForm.amount}\n                            onChange={(e) => setAirdropForm({...airdropForm, amount: e.target.value})}\n                            className=\"bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent\"\n                          />\n                        </div>\n                        <Button onClick={handleAirdrop} disabled={isLoading}>\n                          Launch Airdrop\n                        </Button>\n                      </div>\n                    </DialogContent>\n                  </Dialog>\n                </CardContent>\n              </Card>\n            </div>\n          </TabsContent>\n        </Tabs>\n      </div>\n    </div>\n  )\n}\n"
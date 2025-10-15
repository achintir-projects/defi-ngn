'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { 
  Send, 
  Receive, 
  Coins, 
  DollarSign, 
  Clock, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Zap,
  Shield,
  Calendar,
  Target,
  TrendingUp,
  FileText,
  Copy,
  Download,
  Upload
} from 'lucide-react'

interface TokenConfig {
  symbol: string
  name: string
  decimals: number
  chain: string
  currentPrice: number
  forcedPrice: number
  maxSupply: number
  circulatingSupply: number
  isAdminControlled: boolean
}

interface InjectionJob {
  id: string
  tokenSymbol: string
  amount: number
  forcedPrice: number
  targetWallets: string[]
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: string
  completedAt?: string
  gasless: boolean
  scheduledFor?: string
  totalValue: number
  transactionHash?: string
}

interface ClaimSignature {
  id: string
  userWallet: string
  tokenSymbol: string
  amount: number
  signature: string
  expiry: string
  used: boolean
  usedAt?: string
  createdAt: string
}

const mockTokenConfigs: TokenConfig[] = [
  {
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    chain: 'Ethereum',
    currentPrice: 1.0,
    forcedPrice: 2.0,
    maxSupply: 100000000,
    circulatingSupply: 85000000,
    isAdminControlled: true
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
    chain: 'Solana',
    currentPrice: 150.0,
    forcedPrice: 500.0,
    maxSupply: 500000000,
    circulatingSupply: 350000000,
    isAdminControlled: true
  },
  {
    symbol: 'BNB',
    name: 'Binance Coin',
    decimals: 18,
    chain: 'BSC',
    currentPrice: 600.0,
    forcedPrice: 800.0,
    maxSupply: 200000000,
    circulatingSupply: 145000000,
    isAdminControlled: true
  },
  {
    symbol: 'CUSTOM',
    name: 'Platform Token',
    decimals: 18,
    chain: 'Custom Network',
    currentPrice: 0.1,
    forcedPrice: 10.0,
    maxSupply: 10000000,
    circulatingSupply: 2500000,
    isAdminControlled: true
  }
]

export default function TokenInjectionManager() {
  const [tokenConfigs, setTokenConfigs] = useState<TokenConfig[]>(mockTokenConfigs)
  const [injectionJobs, setInjectionJobs] = useState<InjectionJob[]>([])
  const [claimSignatures, setClaimSignatures] = useState<ClaimSignature[]>([])
  const [selectedToken, setSelectedToken] = useState('')
  const [injectAmount, setInjectAmount] = useState('')
  const [forcedPrice, setForcedPrice] = useState('')
  const [targetWallets, setTargetWallets] = useState('')
  const [isGasless, setIsGasless] = useState(true)
  const [isScheduled, setIsScheduled] = useState(false)
  const [scheduledDate, setScheduledDate] = useState('')
  const [isBulkMode, setIsBulkMode] = useState(false)
  const [bulkData, setBulkData] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState('inject')
  
  const { toast } = useToast()

  useEffect(() => {
    loadMockData()
  }, [])

  const loadMockData = () => {
    // Mock injection jobs
    const mockJobs: InjectionJob[] = [
      {
        id: '1',
        tokenSymbol: 'USDT',
        amount: 1000,
        forcedPrice: 2.0,
        targetWallets: ['0x742d35Cc6634C0532925a3b844Bc454e4438f44e'],
        status: 'completed',
        createdAt: '2024-01-15T10:30:00Z',
        completedAt: '2024-01-15T10:32:00Z',
        gasless: true,
        totalValue: 2000.0,
        transactionHash: '0x123abc...def456'
      },
      {
        id: '2',
        tokenSymbol: 'SOL',
        amount: 5,
        forcedPrice: 500.0,
        targetWallets: ['0x8ba1f109551bD432803012645Ac136ddd64DBA72'],
        status: 'processing',
        createdAt: '2024-01-15T11:00:00Z',
        gasless: false,
        totalValue: 2500.0
      },
      {
        id: '3',
        tokenSymbol: 'CUSTOM',
        amount: 500,
        forcedPrice: 10.0,
        targetWallets: ['0x1234567890123456789012345678901234567890'],
        status: 'pending',
        createdAt: '2024-01-15T11:30:00Z',
        gasless: true,
        scheduledFor: '2024-01-15T12:00:00Z',
        totalValue: 5000.0
      }
    ]
    setInjectionJobs(mockJobs)

    // Mock claim signatures
    const mockSignatures: ClaimSignature[] = [
      {
        id: '1',
        userWallet: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        tokenSymbol: 'USDT',
        amount: 100,
        signature: '0xabc123...def456',
        expiry: '2024-01-20T10:30:00Z',
        used: false,
        createdAt: '2024-01-15T10:30:00Z'
      },
      {
        id: '2',
        userWallet: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
        tokenSymbol: 'SOL',
        amount: 2,
        signature: '0xdef456...abc123',
        expiry: '2024-01-20T11:00:00Z',
        used: true,
        usedAt: '2024-01-15T11:05:00Z',
        createdAt: '2024-01-15T11:00:00Z'
      }
    ]
    setClaimSignatures(mockSignatures)
  }

  const handleTokenInjection = async () => {
    if (!selectedToken || !injectAmount || !forcedPrice) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      // Simulate token injection
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const targetWalletList = targetWallets.split('\n').filter(w => w.trim())
      
      const newJob: InjectionJob = {
        id: Date.now().toString(),
        tokenSymbol: selectedToken,
        amount: parseFloat(injectAmount),
        forcedPrice: parseFloat(forcedPrice),
        targetWallets: targetWalletList.length > 0 ? targetWalletList : ['0x1234567890123456789012345678901234567890'],
        status: isScheduled ? 'pending' : 'processing',
        createdAt: new Date().toISOString(),
        gasless: isGasless,
        scheduledFor: isScheduled ? scheduledDate : undefined,
        totalValue: parseFloat(injectAmount) * parseFloat(forcedPrice)
      }

      setInjectionJobs(prev => [newJob, ...prev])
      
      toast({
        title: "Token Injection Created",
        description: `Created injection job for ${injectAmount} ${selectedToken} at forced price $${forcedPrice}`,
      })
      
      // Reset form
      setSelectedToken('')
      setInjectAmount('')
      setForcedPrice('')
      setTargetWallets('')
      setIsGasless(true)
      setIsScheduled(false)
      setScheduledDate('')
      setIsBulkMode(false)
      setBulkData('')
    } catch (error) {
      toast({
        title: "Injection Failed",
        description: "Failed to create injection job. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkInjection = async () => {
    if (!bulkData) {
      toast({
        title: "No Data Provided",
        description: "Please provide bulk injection data.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      // Simulate bulk injection processing
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const lines = bulkData.split('\n').filter(line => line.trim())
      const processedJobs = lines.map((line, index) => {
        const [token, amount, price, wallet] = line.split(',').map(item => item.trim())
        return {
          id: `bulk_${Date.now()}_${index}`,
          tokenSymbol: token,
          amount: parseFloat(amount),
          forcedPrice: parseFloat(price),
          targetWallets: [wallet],
          status: 'pending' as const,
          createdAt: new Date().toISOString(),
          gasless: true,
          totalValue: parseFloat(amount) * parseFloat(price)
        }
      })

      setInjectionJobs(prev => [...processedJobs, ...prev])
      
      toast({
        title: "Bulk Injection Created",
        description: `Created ${processedJobs.length} injection jobs successfully`,
      })
      
      setBulkData('')
      setIsBulkMode(false)
    } catch (error) {
      toast({
        title: "Bulk Injection Failed",
        description: "Failed to process bulk injection data.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCreateClaimSignature = async () => {
    if (!selectedToken || !injectAmount || !targetWallets) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      // Simulate signature creation
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const targetWalletList = targetWallets.split('\n').filter(w => w.trim())
      
      const newSignatures = targetWalletList.map(wallet => ({
        id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
        userWallet: wallet,
        tokenSymbol: selectedToken,
        amount: parseFloat(injectAmount),
        signature: '0x' + Math.random().toString(16).substr(2, 64),
        expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days expiry
        used: false,
        createdAt: new Date().toISOString()
      }))

      setClaimSignatures(prev => [...newSignatures, ...prev])
      
      toast({
        title: "Claim Signatures Created",
        description: `Created ${newSignatures.length} gasless claim signatures`,
      })
      
      // Reset form
      setSelectedToken('')
      setInjectAmount('')
      setTargetWallets('')
    } catch (error) {
      toast({
        title: "Signature Creation Failed",
        description: "Failed to create claim signatures.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-600">Completed</Badge>
      case 'processing':
        return <Badge className="bg-blue-600">Processing</Badge>
      case 'pending':
        return <Badge className="bg-yellow-600">Pending</Badge>
      case 'failed':
        return <Badge className="bg-red-600">Failed</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inject">Token Injection</TabsTrigger>
          <TabsTrigger value="gasless">Gasless Claims</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="inject" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Injection Form */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Send className="mr-2 h-5 w-5" />
                  Token Injection
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Inject tokens with forced pricing to target wallets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isBulkMode ? (
                  <>
                    <div>
                      <Label htmlFor="token" className="text-white">Token Type</Label>
                      <Select value={selectedToken} onValueChange={setSelectedToken}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="Select token" />
                        </SelectTrigger>
                        <SelectContent>
                          {tokenConfigs.map((token) => (
                            <SelectItem key={token.symbol} value={token.symbol}>
                              {token.symbol} - {token.name} (Forced: ${token.forcedPrice})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="amount" className="text-white">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.000001"
                        value={injectAmount}
                        onChange={(e) => setInjectAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="price" className="text-white">Forced Price (USD)</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={forcedPrice}
                        onChange={(e) => setForcedPrice(e.target.value)}
                        placeholder="Enter forced price"
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="wallets" className="text-white">Target Wallets (one per line)</Label>
                      <Textarea
                        id="wallets"
                        value={targetWallets}
                        onChange={(e) => setTargetWallets(e.target.value)}
                        placeholder="0x123...&#10;0x456...&#10;0x789..."
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 min-h-[100px]"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="gasless"
                          checked={isGasless}
                          onCheckedChange={setIsGasless}
                        />
                        <Label htmlFor="gasless" className="text-white">Gasless Transaction</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="scheduled"
                          checked={isScheduled}
                          onCheckedChange={setIsScheduled}
                        />
                        <Label htmlFor="scheduled" className="text-white">Schedule for Later</Label>
                      </div>
                      
                      {isScheduled && (
                        <div>
                          <Label htmlFor="schedule" className="text-white">Schedule Date</Label>
                          <Input
                            id="schedule"
                            type="datetime-local"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            className="bg-white/10 border-white/20 text-white"
                          />
                        </div>
                      )}
                    </div>
                    
                    <Button
                      onClick={handleTokenInjection}
                      disabled={isProcessing}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      {isProcessing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Create Injection Job
                    </Button>
                  </>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="bulkData" className="text-white">Bulk Injection Data</Label>
                      <Textarea
                        id="bulkData"
                        value={bulkData}
                        onChange={(e) => setBulkData(e.target.value)}
                        placeholder="TOKEN,AMOUNT,FORCED_PRICE,WALLET_ADDRESS&#10;USDT,1000,2.0,0x123...&#10;SOL,5,500.0,0x456...&#10;BNB,2,800.0,0x789..."
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 min-h-[200px]"
                      />
                      <p className="text-xs text-gray-400 mt-2">
                        Format: Token Symbol, Amount, Forced Price, Wallet Address (one per line)
                      </p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        onClick={handleBulkInjection}
                        disabled={isProcessing}
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                      >
                        {isProcessing ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="mr-2 h-4 w-4" />
                        )}
                        Process Bulk Injection
                      </Button>
                      <Button
                        onClick={() => setIsBulkMode(false)}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                )}
                
                {!isBulkMode && (
                  <Button
                    onClick={() => setIsBulkMode(true)}
                    variant="outline"
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Switch to Bulk Mode
                  </Button>
                )}
              </CardContent>
            </Card>
            
            {/* Active Jobs */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  Active Injection Jobs
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Monitor pending and processing injection jobs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {injectionJobs.filter(job => job.status !== 'completed').length === 0 ? (
                    <p className="text-gray-400 text-center py-4">No active injection jobs</p>
                  ) : (
                    injectionJobs.filter(job => job.status !== 'completed').map((job) => (
                      <div key={job.id} className="p-3 bg-white/5 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-white font-medium">{job.amount} {job.tokenSymbol}</p>
                            <p className="text-xs text-gray-400">
                              {job.targetWallets.length} wallet(s) • ${job.forcedPrice} each
                            </p>
                          </div>
                          {getStatusBadge(job.status)}
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-400">
                            Total: ${job.totalValue.toLocaleString()}
                          </span>
                          <span className="text-gray-400">
                            {job.gasless ? <Zap className="inline h-3 w-3 mr-1" /> : <Coins className="inline h-3 w-3 mr-1" />}
                            {job.gasless ? 'Gasless' : 'Standard'}
                          </span>
                        </div>
                        {job.scheduledFor && (
                          <div className="flex items-center text-xs text-yellow-400 mt-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            Scheduled for {new Date(job.scheduledFor).toLocaleString()}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="gasless" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Create Claim Signatures */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Create Gasless Claims
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Generate pre-signed transactions for gasless token claims
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="claimToken" className="text-white">Token Type</Label>
                  <Select value={selectedToken} onValueChange={setSelectedToken}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Select token" />
                    </SelectTrigger>
                    <SelectContent>
                      {tokenConfigs.map((token) => (
                        <SelectItem key={token.symbol} value={token.symbol}>
                          {token.symbol} - {token.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="claimAmount" className="text-white">Amount per Wallet</Label>
                  <Input
                    id="claimAmount"
                    type="number"
                    step="0.000001"
                    value={injectAmount}
                    onChange={(e) => setInjectAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>
                
                <div>
                  <Label htmlFor="claimWallets" className="text-white">Target Wallets (one per line)</Label>
                  <Textarea
                    id="claimWallets"
                    value={targetWallets}
                    onChange={(e) => setTargetWallets(e.target.value)}
                    placeholder="0x123...&#10;0x456...&#10;0x789..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 min-h-[100px]"
                  />
                </div>
                
                <Button
                  onClick={handleCreateClaimSignature}
                  disabled={isProcessing}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isProcessing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="mr-2 h-4 w-4" />
                  )}
                  Create Claim Signatures
                </Button>
              </CardContent>
            </Card>
            
            {/* Active Claim Signatures */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Active Claim Signatures
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Pre-signed transactions waiting to be claimed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {claimSignatures.filter(sig => !sig.used).length === 0 ? (
                    <p className="text-gray-400 text-center py-4">No active claim signatures</p>
                  ) : (
                    claimSignatures.filter(sig => !sig.used).map((sig) => (
                      <div key={sig.id} className="p-3 bg-white/5 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-white font-medium">{sig.amount} {sig.tokenSymbol}</p>
                            <p className="text-xs text-gray-400">
                              {sig.userWallet.slice(0, 6)}...{sig.userWallet.slice(-4)}
                            </p>
                          </div>
                          <Badge className="bg-green-600">Available</Badge>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-400">
                            Expires: {new Date(sig.expiry).toLocaleDateString()}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              navigator.clipboard.writeText(sig.signature)
                              toast({
                                title: "Signature Copied",
                                description: "Claim signature copied to clipboard",
                              })
                            }}
                            className="p-1 h-6 w-6"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-6">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                Injection History
              </CardTitle>
              <CardDescription className="text-gray-300">
                View all token injection jobs and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {injectionJobs.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">No injection history</p>
                ) : (
                  injectionJobs.map((job) => (
                    <div key={job.id} className="p-4 bg-white/5 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-white font-medium">{job.amount} {job.tokenSymbol}</p>
                          <p className="text-sm text-gray-400">
                            {job.targetWallets.length} wallet(s) • ${job.forcedPrice} each
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(job.status)}
                          {job.gasless && (
                            <Badge variant="outline" className="text-xs">
                              <Zap className="h-3 w-3 mr-1" />
                              Gasless
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Total Value:</span>
                          <span className="text-white ml-2">${job.totalValue.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Created:</span>
                          <span className="text-white ml-2">
                            {new Date(job.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {job.completedAt && (
                          <div>
                            <span className="text-gray-400">Completed:</span>
                            <span className="text-white ml-2">
                              {new Date(job.completedAt).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {job.transactionHash && (
                          <div>
                            <span className="text-gray-400">Transaction:</span>
                            <span className="text-white ml-2 font-mono text-xs">
                              {job.transactionHash.slice(0, 10)}...
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {job.scheduledFor && (
                        <div className="mt-2 flex items-center text-xs text-yellow-400">
                          <Calendar className="h-3 w-3 mr-1" />
                          Scheduled for {new Date(job.scheduledFor).toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
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
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { 
  TrendingUp, 
  Send, 
  RefreshCw, 
  Search, 
  Filter, 
  Download, 
  Eye,
  Copy,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Network,
  Database,
  BarChart3,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Hash,
  Calendar,
  DollarSign,
  Coins,
  Truck,
  Settings
} from 'lucide-react'

interface Transaction {
  id: string
  type: 'injection' | 'transfer' | 'claim' | 'bridge' | 'withdrawal'
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  amount: number
  tokenSymbol: string
  tokenName: string
  fromAddress: string
  toAddress: string
  hash?: string
  blockNumber?: number
  gasUsed?: number
  gasPrice?: number
  timestamp: string
  chain: string
  destinationChain?: string
  forcedPrice: number
  realPrice: number
  value: number
  fee?: number
  confirmations?: number
  requiredConfirmations?: number
  isGasless: boolean
  retryCount: number
  maxRetries: number
  errorMessage?: string
}

interface BridgeTransfer {
  id: string
  sourceChain: string
  destinationChain: string
  tokenSymbol: string
  amount: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  sourceTxHash: string
  destinationTxHash?: string
  timestamp: string
  estimatedDuration: number
  progress: number
  fee: number
  relayer: string
}

interface AnalyticsData {
  totalVolume: number
  totalTransactions: number
  successRate: number
  averageFee: number
  topTokens: Array<{ symbol: string; volume: number }>
  chainDistribution: Array<{ chain: string; transactions: number }>
  dailyVolume: Array<{ date: string; volume: number }>
}

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [bridgeTransfers, setBridgeTransfers] = useState<BridgeTransfer[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedChain, setSelectedChain] = useState('all')
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [activeTab, setActiveTab] = useState('transactions')
  const [dateRange, setDateRange] = useState('7d')
  
  const { toast } = useToast()

  useEffect(() => {
    loadMockData()
  }, [])

  const loadMockData = () => {
    // Mock transactions
    const mockTransactions: Transaction[] = [
      {
        id: '1',
        type: 'injection',
        status: 'completed',
        amount: 1000,
        tokenSymbol: 'USDT',
        tokenName: 'Tether USD',
        fromAddress: '0x0000000000000000000000000000000000000000',
        toAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        hash: '0x123abc456def789ghi012jkl345mno678pqr901stu',
        blockNumber: 18543210,
        gasUsed: 21000,
        gasPrice: 20,
        timestamp: '2024-01-15T10:30:00Z',
        chain: 'Ethereum',
        forcedPrice: 2.0,
        realPrice: 1.0,
        value: 2000.0,
        fee: 0.42,
        confirmations: 12,
        requiredConfirmations: 12,
        isGasless: true,
        retryCount: 0,
        maxRetries: 3
      },
      {
        id: '2',
        type: 'bridge',
        status: 'processing',
        amount: 5,
        tokenSymbol: 'SOL',
        tokenName: 'Solana',
        fromAddress: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
        toAddress: 'So11111111111111111111111111111111111111112',
        sourceTxHash: '0xdef456abc789ghi012jkl345mno678pqr901stu234vwx',
        timestamp: '2024-01-15T11:00:00Z',
        chain: 'Ethereum',
        destinationChain: 'Solana',
        forcedPrice: 500.0,
        realPrice: 150.0,
        value: 2500.0,
        fee: 15.0,
        confirmations: 6,
        requiredConfirmations: 12,
        isGasless: false,
        retryCount: 1,
        maxRetries: 3
      },
      {
        id: '3',
        type: 'claim',
        status: 'pending',
        amount: 100,
        tokenSymbol: 'USDT',
        tokenName: 'Tether USD',
        fromAddress: '0x0000000000000000000000000000000000000000',
        toAddress: '0x1234567890123456789012345678901234567890',
        timestamp: '2024-01-15T11:30:00Z',
        chain: 'Ethereum',
        forcedPrice: 2.0,
        realPrice: 1.0,
        value: 200.0,
        confirmations: 0,
        requiredConfirmations: 1,
        isGasless: true,
        retryCount: 0,
        maxRetries: 3
      },
      {
        id: '4',
        type: 'transfer',
        status: 'failed',
        amount: 2.5,
        tokenSymbol: 'BNB',
        tokenName: 'Binance Coin',
        fromAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        toAddress: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
        timestamp: '2024-01-15T12:00:00Z',
        chain: 'BSC',
        forcedPrice: 800.0,
        realPrice: 600.0,
        value: 2000.0,
        fee: 0.001,
        confirmations: 0,
        requiredConfirmations: 15,
        isGasless: false,
        retryCount: 3,
        maxRetries: 3,
        errorMessage: 'Insufficient gas balance'
      }
    ]
    setTransactions(mockTransactions)

    // Mock bridge transfers
    const mockBridgeTransfers: BridgeTransfer[] = [
      {
        id: '1',
        sourceChain: 'Ethereum',
        destinationChain: 'BSC',
        tokenSymbol: 'USDT',
        amount: 500,
        status: 'completed',
        sourceTxHash: '0xabc123def456ghi789jkl012mno345pqr678stu901',
        destinationTxHash: '0xdef456ghi789jkl012mno345pqr678stu901abc123',
        timestamp: '2024-01-15T09:00:00Z',
        estimatedDuration: 300000, // 5 minutes
        progress: 100,
        fee: 5.0,
        relayer: 'Relayer #1'
      },
      {
        id: '2',
        sourceChain: 'BSC',
        destinationChain: 'Solana',
        tokenSymbol: 'BNB',
        amount: 1,
        status: 'processing',
        sourceTxHash: '0xghi789jkl012mno345pqr678stu901abc123def456',
        timestamp: '2024-01-15T10:30:00Z',
        estimatedDuration: 600000, // 10 minutes
        progress: 65,
        fee: 8.0,
        relayer: 'Relayer #2'
      },
      {
        id: '3',
        sourceChain: 'Solana',
        destinationChain: 'Ethereum',
        tokenSymbol: 'SOL',
        amount: 2,
        status: 'pending',
        sourceTxHash: '0xjkl012mno345pqr678stu901abc123def456ghi789',
        timestamp: '2024-01-15T11:15:00Z',
        estimatedDuration: 900000, // 15 minutes
        progress: 25,
        fee: 12.0,
        relayer: 'Relayer #3'
      }
    ]
    setBridgeTransfers(mockBridgeTransfers)

    // Mock analytics
    const mockAnalytics: AnalyticsData = {
      totalVolume: 1542600.50,
      totalTransactions: 1247,
      successRate: 94.5,
      averageFee: 2.34,
      topTokens: [
        { symbol: 'USDT', volume: 875000 },
        { symbol: 'SOL', volume: 425000 },
        { symbol: 'BNB', volume: 187500 },
        { symbol: 'CUSTOM', volume: 55100.50 }
      ],
      chainDistribution: [
        { chain: 'Ethereum', transactions: 523 },
        { chain: 'BSC', transactions: 342 },
        { chain: 'Solana', transactions: 267 },
        { chain: 'Custom Network', transactions: 115 }
      ],
      dailyVolume: [
        { date: '2024-01-09', volume: 180000 },
        { date: '2024-01-10', volume: 220000 },
        { date: '2024-01-11', volume: 195000 },
        { date: '2024-01-12', volume: 240000 },
        { date: '2024-01-13', volume: 210000 },
        { date: '2024-01-14', volume: 235000 },
        { date: '2024-01-15', volume: 262600.50 }
      ]
    }
    setAnalytics(mockAnalytics)
  }

  const handleRetryTransaction = async (transactionId: string) => {
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setTransactions(prev => 
        prev.map(tx => 
          tx.id === transactionId 
            ? { 
                ...tx, 
                status: 'processing' as const,
                retryCount: tx.retryCount + 1,
                errorMessage: undefined
              }
            : tx
        )
      )
      
      toast({
        title: "Transaction RefreshCw Initiated",
        description: "Transaction is being retried",
      })
    } catch (error) {
      toast({
        title: "RefreshCw Failed",
        description: "Failed to retry transaction",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash)
    toast({
      title: "Hash Copied",
      description: "Transaction hash copied to clipboard",
    })
  }

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = searchTerm === '' || 
      tx.hash?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.fromAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.toAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.tokenSymbol.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = selectedType === 'all' || tx.type === selectedType
    const matchesStatus = selectedStatus === 'all' || tx.status === selectedStatus
    const matchesChain = selectedChain === 'all' || tx.chain === selectedChain
    
    return matchesSearch && matchesType && matchesStatus && matchesChain
  })

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
      case 'cancelled':
        return <Badge className="bg-gray-600">Cancelled</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'injection':
        return <Download className="h-4 w-4 text-green-400" />
      case 'transfer':
        return <Send className="h-4 w-4 text-blue-400" />
      case 'claim':
        return <Zap className="h-4 w-4 text-purple-400" />
      case 'bridge':
        return <Network className="h-4 w-4 text-orange-400" />
      case 'withdrawal':
        return <ArrowUpRight className="h-4 w-4 text-red-400" />
      default:
        return <Activity className="h-4 w-4 text-gray-400" />
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="bridges">Bridge Transfers</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>
        
        <TabsContent value="transactions" className="space-y-6">
          {/* Filters */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Activity className="mr-2 h-5 w-5" />
                Transaction History
              </CardTitle>
              <CardDescription className="text-gray-300">
                Monitor all transactions and cross-chain transfers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 w-64"
                  />
                </div>
                
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white w-40">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="injection">Injection</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                    <SelectItem value="claim">Claim</SelectItem>
                    <SelectItem value="bridge">Bridge</SelectItem>
                    <SelectItem value="withdrawal">Withdrawal</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white w-40">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={selectedChain} onValueChange={setSelectedChain}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white w-40">
                    <SelectValue placeholder="All Chains" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Chains</SelectItem>
                    <SelectItem value="Ethereum">Ethereum</SelectItem>
                    <SelectItem value="BSC">BSC</SelectItem>
                    <SelectItem value="Solana">Solana</SelectItem>
                    <SelectItem value="Custom Network">Custom Network</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white w-32">
                    <SelectValue placeholder="7 Days" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1d">24 Hours</SelectItem>
                    <SelectItem value="7d">7 Days</SelectItem>
                    <SelectItem value="30d">30 Days</SelectItem>
                    <SelectItem value="90d">90 Days</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                
                <Button onClick={() => loadMockData()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-white">Type</TableHead>
                    <TableHead className="text-white">Token</TableHead>
                    <TableHead className="text-white">Amount</TableHead>
                    <TableHead className="text-white">From/To</TableHead>
                    <TableHead className="text-white">Status</TableHead>
                    <TableHead className="text-white">Chain</TableHead>
                    <TableHead className="text-white">Time</TableHead>
                    <TableHead className="text-white">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(tx.type)}
                          <span className="text-white capitalize">{tx.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-white font-medium">{tx.tokenSymbol}</p>
                          <p className="text-gray-400 text-xs">{tx.tokenName}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-white">{tx.amount.toLocaleString()}</p>
                          <p className="text-gray-400 text-xs">${tx.value.toLocaleString()}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-white text-xs">{formatAddress(tx.fromAddress)}</p>
                          <ArrowDownRight className="h-3 w-3 mx-auto text-gray-400" />
                          <p className="text-white text-xs">{formatAddress(tx.toAddress)}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(tx.status)}</TableCell>
                      <TableCell className="text-white">{tx.chain}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-white text-xs">
                            {new Date(tx.timestamp).toLocaleDateString()}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {new Date(tx.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" onClick={() => setSelectedTransaction(tx)}>
                            <Eye className="h-3 w-3" />
                          </Button>
                          {tx.hash && (
                            <Button size="sm" variant="outline" onClick={() => handleCopyHash(tx.hash!)}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          )}
                          {tx.status === 'failed' && tx.retryCount < tx.maxRetries && (
                            <Button 
                              size="sm" 
                              onClick={() => handleRetryTransaction(tx.id)}
                              disabled={isLoading}
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="bridges" className="space-y-6">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Network className="mr-2 h-5 w-5" />
                Bridge Transfers
              </CardTitle>
              <CardDescription className="text-gray-300">
                Monitor cross-chain bridge transfers and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bridgeTransfers.map((transfer) => (
                  <Card key={transfer.id} className="bg-white/5 border-white/10">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-white font-medium">
                            {transfer.amount} {transfer.tokenSymbol}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {transfer.sourceChain} → {transfer.destinationChain}
                          </p>
                        </div>
                        {getStatusBadge(transfer.status)}
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-gray-400 text-xs">Source Transaction</p>
                          <div className="flex items-center space-x-2">
                            <p className="text-white font-mono text-xs">
                              {formatAddress(transfer.sourceTxHash)}
                            </p>
                            <Button size="sm" variant="ghost" onClick={() => handleCopyHash(transfer.sourceTxHash)}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        {transfer.destinationTxHash && (
                          <div>
                            <p className="text-gray-400 text-xs">Destination Transaction</p>
                            <div className="flex items-center space-x-2">
                              <p className="text-white font-mono text-xs">
                                {formatAddress(transfer.destinationTxHash)}
                              </p>
                              <Button size="sm" variant="ghost" onClick={() => handleCopyHash(transfer.destinationTxHash)}>
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-gray-400 text-xs">Fee</p>
                          <p className="text-white">${transfer.fee}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">Relayer</p>
                          <p className="text-white">{transfer.relayer}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">Started</p>
                          <p className="text-white">
                            {new Date(transfer.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      {transfer.status === 'processing' && (
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-gray-400 text-sm">Progress</p>
                            <p className="text-white text-sm">{transfer.progress}%</p>
                          </div>
                          <Progress value={transfer.progress} className="h-2" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6">
          {analytics && (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <Badge className="bg-green-600">+12%</Badge>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-1">
                    ${analytics.totalVolume.toLocaleString()}
                  </h3>
                  <p className="text-gray-400 text-sm">Total Volume</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Activity className="h-5 w-5" />
                    </div>
                    <Badge className="bg-blue-600">+8%</Badge>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-1">
                    {analytics.totalTransactions.toLocaleString()}
                  </h3>
                  <p className="text-gray-400 text-sm">Total Transactions</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <Badge className="bg-purple-600">+2%</Badge>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-1">
                    {analytics.successRate}%
                  </h3>
                  <p className="text-gray-400 text-sm">Success Rate</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-orange-500/20 rounded-lg">
                      <Coins className="h-5 w-5" />
                    </div>
                    <Badge className="bg-orange-600">-5%</Badge>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-1">
                    ${analytics.averageFee}
                  </h3>
                  <p className="text-gray-400 text-sm">Average Fee</p>
                </CardContent>
              </Card>
            </div>
          )}
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Top Tokens
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics && (
                  <div className="space-y-3">
                    {analytics.topTokens.map((token, index) => (
                      <div key={token.symbol} className="flex justify-between items-center">
                        <p className="text-white">{token.symbol}</p>
                        <p className="text-white font-medium">
                          ${token.volume.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Database className="mr-2 h-5 w-5" />
                  Chain Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics && (
                  <div className="space-y-3">
                    {analytics.chainDistribution.map((chain, index) => (
                      <div key={chain.chain} className="flex justify-between items-center">
                        <p className="text-white">{chain.chain}</p>
                        <p className="text-white font-medium">
                          {chain.transactions} txs
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="monitoring" className="space-y-6">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                System Monitoring
              </CardTitle>
              <CardDescription className="text-gray-300">
                Real-time system status and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Network Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Ethereum</span>
                        <Badge className="bg-green-600">Online</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">BSC</span>
                        <Badge className="bg-green-600">Online</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Solana</span>
                        <Badge className="bg-yellow-600">Slow</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Custom Network</span>
                        <Badge className="bg-green-600">Online</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Bridge Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">ETH → BSC</span>
                        <Badge className="bg-green-600">Healthy</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">BSC → SOL</span>
                        <Badge className="bg-yellow-600">Delayed</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">SOL → ETH</span>
                        <Badge className="bg-green-600">Healthy</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Custom → ETH</span>
                        <Badge className="bg-green-600">Healthy</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">TPS</span>
                        <span className="text-white">15.2</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Avg Block Time</span>
                        <span className="text-white">3.2s</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Success Rate</span>
                        <span className="text-white">94.5%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Failed Retries</span>
                        <span className="text-white">2.1%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Transaction Detail Dialog */}
      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent className="bg-white/10 backdrop-blur-sm border-white/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400">Type</Label>
                  <p className="text-white capitalize">{selectedTransaction.type}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Status</Label>
                  {getStatusBadge(selectedTransaction.status)}
                </div>
                <div>
                  <Label className="text-gray-400">Token</Label>
                  <p className="text-white">{selectedTransaction.tokenSymbol} - {selectedTransaction.tokenName}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Amount</Label>
                  <p className="text-white">{selectedTransaction.amount.toLocaleString()} {selectedTransaction.tokenSymbol}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Forced Price</Label>
                  <p className="text-white">${selectedTransaction.forcedPrice}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Real Price</Label>
                  <p className="text-white">${selectedTransaction.realPrice}</p>
                </div>
                <div>
                  <Label className="text-gray-400">From Address</Label>
                  <p className="text-white font-mono text-sm">{selectedTransaction.fromAddress}</p>
                </div>
                <div>
                  <Label className="text-gray-400">To Address</Label>
                  <p className="text-white font-mono text-sm">{selectedTransaction.toAddress}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Chain</Label>
                  <p className="text-white">{selectedTransaction.chain}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Timestamp</Label>
                  <p className="text-white">{new Date(selectedTransaction.timestamp).toLocaleString()}</p>
                </div>
                {selectedTransaction.hash && (
                  <div className="md:col-span-2">
                    <Label className="text-gray-400">Transaction Hash</Label>
                    <div className="flex items-center space-x-2">
                      <p className="text-white font-mono text-sm flex-1">{selectedTransaction.hash}</p>
                      <Button size="sm" variant="outline" onClick={() => handleCopyHash(selectedTransaction.hash!)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
                {selectedTransaction.errorMessage && (
                  <div className="md:col-span-2">
                    <Label className="text-gray-400">Error Message</Label>
                    <p className="text-red-400 text-sm">{selectedTransaction.errorMessage}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
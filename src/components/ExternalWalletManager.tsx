'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { 
  CreditCard, 
  Smartphone, 
  Monitor, 
  QrCode, 
  Link, 
  Unlink, 
  Copy, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ArrowRight,
  Wallet,
  ExternalLink,
  Download,
  Scan
} from 'lucide-react'

interface WalletConnection {
  id: string
  type: 'metamask' | 'trustwallet' | 'bybit' | 'phantom' | 'coinbase'
  name: string
  address: string
  connected: boolean
  lastActive: string
  chain: string
  balance: number
  transactions: number
  isMobile: boolean
  deepLink?: string
}

interface WalletConfig {
  type: 'metamask' | 'trustwallet' | 'bybit' | 'phantom' | 'coinbase'
  name: string
  icon: React.ReactNode
  description: string
  supportedChains: string[]
  isMobile: boolean
  deepLink?: string
  website: string
}

const walletConfigs: WalletConfig[] = [
  {
    type: 'metamask',
    name: 'MetaMask',
    icon: <CreditCard className="h-6 w-6 text-orange-500" />,
    description: 'Most popular Ethereum wallet with browser extension',
    supportedChains: ['Ethereum', 'BSC', 'Polygon', 'Avalanche'],
    isMobile: false,
    website: 'https://metamask.io'
  },
  {
    type: 'trustwallet',
    name: 'Trust Wallet',
    icon: <Smartphone className="h-6 w-6 text-blue-500" />,
    description: 'Mobile-first wallet with multi-chain support',
    supportedChains: ['Ethereum', 'BSC', 'TRON', 'Solana', 'Polygon'],
    isMobile: true,
    deepLink: 'trust://',
    website: 'https://trustwallet.com'
  },
  {
    type: 'bybit',
    name: 'Bybit Wallet',
    icon: <Wallet className="h-6 w-6 text-yellow-500" />,
    description: 'Exchange-integrated wallet with DeFi features',
    supportedChains: ['Ethereum', 'BSC', 'Polygon', 'Arbitrum'],
    isMobile: false,
    website: 'https://bybit.com'
  },
  {
    type: 'phantom',
    name: 'Phantom',
    icon: <Monitor className="h-6 w-6 text-purple-500" />,
    description: 'Solana ecosystem wallet with NFT support',
    supportedChains: ['Solana', 'Ethereum', 'Polygon'],
    isMobile: false,
    website: 'https://phantom.app'
  },
  {
    type: 'coinbase',
    name: 'Coinbase Wallet',
    icon: <CreditCard className="h-6 w-6 text-blue-600" />,
    description: 'User-friendly wallet from Coinbase exchange',
    supportedChains: ['Ethereum', 'BSC', 'Polygon', 'Avalanche'],
    isMobile: false,
    website: 'https://wallet.coinbase.com'
  }
]

export default function ExternalWalletManager() {
  const [wallets, setWallets] = useState<WalletConnection[]>([])
  const [isConnecting, setIsConnecting] = useState(false)
  const [selectedWalletType, setSelectedWalletType] = useState<string>('')
  const [connectionMethod, setConnectionMethod] = useState<'qr' | 'deeplink' | 'manual'>('qr')
  const [manualAddress, setManualAddress] = useState('')
  const [showQRCode, setShowQRCode] = useState(false)
  const [qrCodeData, setQrCodeData] = useState('')
  const [copiedAddress, setCopiedAddress] = useState('')
  
  const { toast } = useToast()

  useEffect(() => {
    loadMockWallets()
  }, [])

  const loadMockWallets = () => {
    const mockWallets: WalletConnection[] = [
      {
        id: '1',
        type: 'metamask',
        name: 'MetaMask',
        address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        connected: true,
        lastActive: '2024-01-15T10:30:00Z',
        chain: 'Ethereum',
        balance: 1250.50,
        transactions: 23,
        isMobile: false
      },
      {
        id: '2',
        type: 'trustwallet',
        name: 'Trust Wallet',
        address: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
        connected: false,
        lastActive: '2024-01-10T15:45:00Z',
        chain: 'BSC',
        balance: 0,
        transactions: 0,
        isMobile: true,
        deepLink: 'trust://'
      }
    ]
    setWallets(mockWallets)
  }

  const handleConnectWallet = async (walletType: string, method: 'qr' | 'deeplink' | 'manual' = 'qr') => {
    setIsConnecting(true)
    setSelectedWalletType(walletType)
    setConnectionMethod(method)

    try {
      if (method === 'deeplink') {
        const walletConfig = walletConfigs.find(w => w.type === walletType)
        if (walletConfig?.deepLink) {
          // Simulate deep link opening
          await new Promise(resolve => setTimeout(resolve, 1000))
          toast({
            title: "Opening Wallet",
            description: `Opening ${walletConfig.name} for connection...`,
          })
        }
      } else if (method === 'qr') {
        // Generate QR code data
        const qrData = `defi://connect/${walletType}/${Date.now()}`
        setQrCodeData(qrData)
        setShowQRCode(true)
        
        // Simulate QR code scan
        await new Promise(resolve => setTimeout(resolve, 3000))
        setShowQRCode(false)
      } else if (method === 'manual') {
        if (!manualAddress) {
          toast({
            title: "Address Required",
            description: "Please enter a wallet address",
            variant: "destructive",
          })
          setIsConnecting(false)
          return
        }
      }

      // Simulate successful connection
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const walletConfig = walletConfigs.find(w => w.type === walletType)
      const newWallet: WalletConnection = {
        id: Date.now().toString(),
        type: walletType as any,
        name: walletConfig?.name || walletType,
        address: method === 'manual' ? manualAddress : `0x${Math.random().toString(16).substr(2, 40)}`,
        connected: true,
        lastActive: new Date().toISOString(),
        chain: walletConfig?.supportedChains[0] || 'Ethereum',
        balance: Math.random() * 1000,
        transactions: Math.floor(Math.random() * 50),
        isMobile: walletConfig?.isMobile || false,
        deepLink: walletConfig?.deepLink
      }

      setWallets(prev => [...prev.filter(w => w.type !== walletType), newWallet])
      
      toast({
        title: "Wallet Connected",
        description: `${walletConfig?.name} connected successfully!`,
      })
      
      setManualAddress('')
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
      setSelectedWalletType('')
    }
  }

  const handleDisconnectWallet = async (walletId: string) => {
    try {
      setWallets(prev => 
        prev.map(wallet => 
          wallet.id === walletId 
            ? { ...wallet, connected: false, lastActive: new Date().toISOString() }
            : wallet
        )
      )
      
      toast({
        title: "Wallet Disconnected",
        description: "Wallet disconnected successfully",
      })
    } catch (error) {
      toast({
        title: "Disconnection Failed",
        description: "Failed to disconnect wallet",
        variant: "destructive",
      })
    }
  }

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
    setCopiedAddress(address)
    setTimeout(() => setCopiedAddress(''), 2000)
    
    toast({
      title: "Address Copied",
      description: "Wallet address copied to clipboard",
    })
  }

  const handleOpenWallet = (wallet: WalletConnection) => {
    if (wallet.deepLink) {
      window.open(wallet.deepLink, '_blank')
    } else {
      const config = walletConfigs.find(w => w.type === wallet.type)
      if (config?.website) {
        window.open(config.website, '_blank')
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Connected Wallets */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <CreditCard className="mr-2 h-5 w-5" />
            Connected Wallets
          </CardTitle>
          <CardDescription className="text-gray-300">
            Manage your external wallet connections
          </CardDescription>
        </CardHeader>
        <CardContent>
          {wallets.filter(w => w.connected).length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No wallets connected. Connect a wallet below to start receiving tokens.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wallets.filter(w => w.connected).map((wallet) => (
                <Card key={wallet.id} className="bg-white/5 border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {walletConfigs.find(w => w.type === wallet.type)?.icon}
                        <span className="font-semibold text-white">{wallet.name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <Badge variant="outline" className="text-xs bg-green-500/20 text-green-400 border-green-500">
                          Connected
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div>
                        <p className="text-xs text-gray-400">Address</p>
                        <div className="flex items-center space-x-1">
                          <p className="text-xs text-white font-mono bg-black/20 p-1 rounded flex-1">
                            {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                          </p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyAddress(wallet.address)}
                            className="p-1 h-6 w-6"
                          >
                            {copiedAddress === wallet.address ? 
                              <CheckCircle className="h-3 w-3 text-green-400" /> : 
                              <Copy className="h-3 w-3 text-gray-400" />
                            }
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Chain:</span>
                        <span className="text-white">{wallet.chain}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Balance:</span>
                        <span className="text-white">${wallet.balance.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Transactions:</span>
                        <span className="text-white">{wallet.transactions}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenWallet(wallet)}
                        className="flex-1"
                      >
                        <ExternalLink className="mr-1 h-3 w-3" />
                        Open
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDisconnectWallet(wallet.id)}
                        className="flex-1"
                      >
                        <Unlink className="mr-1 h-3 w-3" />
                        Disconnect
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add New Wallet */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Link className="mr-2 h-5 w-5" />
            Add New Wallet
          </CardTitle>
          <CardDescription className="text-gray-300">
            Connect a new external wallet to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="browse" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="browse">Browse Wallets</TabsTrigger>
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            </TabsList>
            
            <TabsContent value="browse" className="space-y-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {walletConfigs.map((wallet) => (
                  <Card key={wallet.type} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        {wallet.icon}
                        <div>
                          <h3 className="font-semibold text-white">{wallet.name}</h3>
                          <p className="text-xs text-gray-400">{wallet.description}</p>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-xs text-gray-400 mb-2">Supported Chains:</p>
                        <div className="flex flex-wrap gap-1">
                          {wallet.supportedChains.map((chain) => (
                            <Badge key={chain} variant="outline" className="text-xs">
                              {chain}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {wallet.isMobile && (
                          <Button
                            size="sm"
                            onClick={() => handleConnectWallet(wallet.type, 'deeplink')}
                            disabled={isConnecting && selectedWalletType === wallet.type}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                          >
                            {isConnecting && selectedWalletType === wallet.type ? (
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            ) : (
                              <Smartphone className="mr-2 h-3 w-3" />
                            )}
                            Connect via App
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          onClick={() => handleConnectWallet(wallet.type, 'qr')}
                          disabled={isConnecting && selectedWalletType === wallet.type}
                          className="w-full"
                        >
                          {isConnecting && selectedWalletType === wallet.type ? (
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          ) : (
                            <QrCode className="mr-2 h-3 w-3" />
                          )}
                          Connect via QR
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(wallet.website, '_blank')}
                          className="w-full"
                        >
                          <Download className="mr-2 h-3 w-3" />
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="manual" className="space-y-4">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Manual Wallet Entry</CardTitle>
                  <CardDescription className="text-gray-300">
                    Enter your wallet address manually to connect
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="walletType" className="text-white">Wallet Type</Label>
                    <select
                      id="walletType"
                      value={selectedWalletType}
                      onChange={(e) => setSelectedWalletType(e.target.value)}
                      className="w-full mt-1 p-2 bg-white/10 border border-white/20 rounded text-white"
                    >
                      <option value="">Select wallet type</option>
                      {walletConfigs.map((wallet) => (
                        <option key={wallet.type} value={wallet.type}>
                          {wallet.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="walletAddress" className="text-white">Wallet Address</Label>
                    <Input
                      id="walletAddress"
                      value={manualAddress}
                      onChange={(e) => setManualAddress(e.target.value)}
                      placeholder="0x..."
                      className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    />
                  </div>
                  
                  <Button
                    onClick={() => handleConnectWallet(selectedWalletType, 'manual')}
                    disabled={!selectedWalletType || !manualAddress || isConnecting}
                    className="w-full"
                  >
                    {isConnecting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Link className="mr-2 h-4 w-4" />
                    )}
                    Connect Wallet
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
        <DialogContent className="bg-white/10 backdrop-blur-sm border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white">Scan QR Code</DialogTitle>
            <DialogDescription className="text-gray-300">
              Scan this QR code with your wallet app to connect
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center">
              <div className="text-center">
                <QrCode className="h-24 w-24 mx-auto text-gray-800" />
                <p className="text-xs text-gray-600 mt-2">QR Code Placeholder</p>
              </div>
            </div>
            <p className="text-sm text-gray-300 text-center">
              Open your wallet app and scan the QR code above
            </p>
            <Button onClick={() => setShowQRCode(false)} variant="outline">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
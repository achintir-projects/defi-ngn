'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import WalletConnectionService, { WalletConnectionResult } from '@/lib/walletConnectionService'
import OffChainTokenService, { WalletInfo, TokenBalance } from '@/lib/offChainTokenService'
import NetworkService from '@/lib/networkService'
import { 
  Wallet, 
  Smartphone, 
  Download, 
  QrCode, 
  ExternalLink, 
  Copy, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Chrome,
  Apple,
  Wallet as WalletIcon,
  Bitcoin,
  Coins,
  Shield,
  Settings
} from 'lucide-react'

interface WalletConnectorProps {
  onWalletConnected?: (walletInfo: WalletInfo) => void
  onWalletDisconnected?: () => void
}

export default function WalletConnector({ onWalletConnected, onWalletDisconnected }: WalletConnectorProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null)
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualAddress, setManualAddress] = useState('')
  const [showQR, setShowQR] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [availableWallets, setAvailableWallets] = useState<string[]>([])
  const [showNetworkDialog, setShowNetworkDialog] = useState(false)
  const [selectedWalletType, setSelectedWalletType] = useState<string>('')
  
  const { toast } = useToast()
  const walletService = WalletConnectionService
  const tokenService = OffChainTokenService
  const networkService = NetworkService

  useEffect(() => {
    // Initialize default tokens
    tokenService.initializeDefaultTokens()
    
    // Check for wallet callbacks first (for mobile wallet returns)
    checkWalletCallbacks()
    
    // Detect available wallets
    const wallets = walletService.detectAvailableWallets()
    
    // Prioritize Trust Wallet and Bybit, then others
    const prioritizedWallets = prioritizeWallets(wallets)
    setAvailableWallets(prioritizedWallets)

    // Setup wallet event listeners
    walletService.setupWalletEventListeners(handleAccountsChanged)

    // Check if already connected
    checkExistingConnection()

    return () => {
      walletService.removeWalletEventListeners()
    }
  }, [])

  // Check for wallet callbacks from mobile apps
  const checkWalletCallbacks = async () => {
    try {
      const callbackResult = await walletService.handleWalletCallback()
      if (callbackResult && callbackResult.success && callbackResult.address) {
        // Handle successful callback connection
        const walletInfo = await tokenService.getOrCreateWallet(
          callbackResult.address,
          callbackResult.walletType || 'unknown'
        )
        
        setWalletInfo(walletInfo)
        setIsConnected(true)
        
        // Store connection
        localStorage.setItem('connected_wallet', JSON.stringify({
          address: callbackResult.address,
          type: callbackResult.walletType || 'unknown'
        }))

        // Load token balances
        await loadTokenBalances(callbackResult.address)

        toast({
          title: "Wallet Connected",
          description: `${callbackResult.walletType || 'Wallet'} connected successfully via callback!`,
        })

        onWalletConnected?.(walletInfo)
      }
    } catch (error) {
      console.error('Error checking wallet callbacks:', error)
    }
  }

  // Get detection status message
  const getDetectionStatus = () => {
    if (availableWallets.length === 0) {
      return "Detecting wallets..."
    }
    
    const mobileWallets = availableWallets.filter(w => ['trustwallet', 'bybit', 'metamask'].includes(w))
    const hasMobileWallets = mobileWallets.length > 0
    
    if (walletService.isDeviceMobile()) {
      if (hasMobileWallets) {
        return `${mobileWallets.length} mobile wallet${mobileWallets.length > 1 ? 's' : ''} available`
      } else {
        return "Mobile wallets may be installed - try connecting below"
      }
    } else {
      const desktopWallets = availableWallets.filter(w => !['manual', 'qr'].includes(w))
      return `${desktopWallets.length} wallet${desktopWallets.length > 1 ? 's' : ''} detected`
    }
  }

  // Prioritize wallets: Trust Wallet, Bybit, then others
  const prioritizeWallets = (wallets: string[]) => {
    const priorityOrder = ['trustwallet', 'bybit', 'metamask', 'coinbase', 'phantom', 'web3', 'manual', 'qr']
    
    return wallets.sort((a, b) => {
      const indexA = priorityOrder.indexOf(a)
      const indexB = priorityOrder.indexOf(b)
      return indexA - indexB
    })
  }

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnectWallet()
    } else {
      // Account changed, update connection
      connectWallet('metamask') // Reconnect with first available method
    }
  }

  const checkExistingConnection = async () => {
    try {
      // Check if we have a stored wallet connection
      const storedWallet = localStorage.getItem('connected_wallet')
      if (storedWallet) {
        const walletData = JSON.parse(storedWallet)
        const info = await tokenService.getOrCreateWallet(
          walletData.address, 
          walletData.type
        )
        
        if (info.isConnected) {
          setWalletInfo(info)
          setIsConnected(true)
          loadTokenBalances(info.address)
          onWalletConnected?.(info)
        }
      }
    } catch (error) {
      console.error('Error checking existing connection:', error)
    }
  }

  const connectWallet = async (walletType: string, address?: string) => {
    setIsLoading(true)
    try {
      let result: WalletConnectionResult

      if (walletType === 'manual') {
        // Show manual input dialog
        setShowManualInput(true)
        return
      } else if (walletType === 'web3') {
        // Try to connect with the available web3 provider
        result = await walletService.connectWallet('metamask') // Fallback to metamask logic
      } else {
        result = await walletService.connectWallet(walletType)
      }

      if (result.success) {
        // Handle pending connections (mobile redirects)
        if (result.address === 'pending') {
          // Show a message that we're waiting for mobile wallet connection
          toast({
            title: "Connecting to Mobile Wallet",
            description: result.error || "Please approve the connection in your wallet app and return to this page.",
            duration: 10000, // Show for 10 seconds
          })
          return
        }

        // Successful connection
        const walletInfo = await tokenService.getOrCreateWallet(
          result.address, 
          result.walletType || walletType
        )

        setWalletInfo(walletInfo)
        setIsConnected(true)
        
        // Store connection
        localStorage.setItem('connected_wallet', JSON.stringify({
          address: result.address,
          type: result.walletType || walletType
        }))

        // Load token balances
        await loadTokenBalances(result.address)

        toast({
          title: "Wallet Connected",
          description: `${result.walletType || walletType} connected successfully!`,
        })

        onWalletConnected?.(walletInfo)
      } else {
        throw new Error(result.error || 'Connection failed')
      }
    } catch (error) {
      console.error('Wallet connection error:', error)
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect wallet",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const disconnectWallet = async () => {
    try {
      if (walletInfo?.address) {
        await walletService.disconnectWallet(walletInfo.address)
      }

      setIsConnected(false)
      setWalletInfo(null)
      setTokenBalances([])
      localStorage.removeItem('connected_wallet')

      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected.",
      })

      onWalletDisconnected?.()
    } catch (error) {
      console.error('Wallet disconnection error:', error)
      toast({
        title: "Disconnection Failed",
        description: "Failed to disconnect wallet.",
        variant: "destructive",
      })
    }
  }

  const loadTokenBalances = async (address: string) => {
    try {
      const balances = await tokenService.getAllTokenBalances(address)
      setTokenBalances(balances)
    } catch (error) {
      console.error('Error loading token balances:', error)
    }
  }

  const copyAddress = () => {
    if (walletInfo?.address) {
      navigator.clipboard.writeText(walletInfo.address)
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard.",
      })
    }
  }

  const handleManualConnect = () => {
    if (manualAddress.trim()) {
      connectWallet('manual', manualAddress.trim())
      setManualAddress('')
      setShowManualInput(false)
    }
  }

  const handleQRConnect = async () => {
    try {
      const { qrCode } = await walletService.connectWithQRCode()
      setQrCode(qrCode)
      setShowQR(true)
    } catch (error) {
      toast({
        title: "QR Code Failed",
        description: "Failed to generate QR code.",
        variant: "destructive",
      })
    }
  }

  const handleSetupNetwork = async (walletType: string) => {
    setSelectedWalletType(walletType)
    setShowNetworkDialog(true)
  }

  const handleAddNetwork = async () => {
    try {
      const success = await networkService.addNetworkToWallet()
      if (success) {
        toast({
          title: "Network Added",
          description: "Custom Network has been added to your wallet successfully!",
        })
        setShowNetworkDialog(false)
      } else {
        throw new Error("Failed to add network")
      }
    } catch (error) {
      toast({
        title: "Network Setup Failed",
        description: "Please add the network manually using the instructions provided.",
        variant: "destructive",
      })
    }
  }

  const getWalletIcon = (walletType: string) => {
    switch (walletType) {
      case 'metamask':
        return <Chrome className="h-6 w-6" />
      case 'trustwallet':
        return <Smartphone className="h-6 w-6" />
      case 'bybit':
        return <Bitcoin className="h-6 w-6" />
      case 'phantom':
        return <WalletIcon className="h-6 w-6" />
      case 'coinbase':
        return <Coins className="h-6 w-6" />
      default:
        return <Wallet className="h-6 w-6" />
    }
  }

  const getWalletName = (walletType: string) => {
    switch (walletType) {
      case 'metamask':
        return 'MetaMask'
      case 'trustwallet':
        return 'Trust Wallet'
      case 'bybit':
        return 'Bybit Wallet'
      case 'phantom':
        return 'Phantom'
      case 'coinbase':
        return 'Coinbase Wallet'
      case 'manual':
        return 'Manual Address'
      case 'qr':
        return 'QR Code'
      case 'web3':
        return 'Web3 Wallet'
      default:
        return 'Unknown Wallet'
    }
  }

  const getWalletDownloadLink = (walletType: string) => {
    switch (walletType) {
      case 'metamask':
        return 'https://metamask.io/download/'
      case 'trustwallet':
        return 'https://trustwallet.com/download/'
      case 'bybit':
        return 'https://www.bybit.com/en/download/'
      case 'phantom':
        return 'https://phantom.app/download/'
      case 'coinbase':
        return 'https://www.coinbase.com/wallet'
      default:
        return '#'
    }
  }

  if (isConnected && walletInfo) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            {getWalletIcon(walletInfo.type)}
            <span className="ml-2">Connected Wallet</span>
          </CardTitle>
          <CardDescription className="text-gray-300">
            Your wallet is connected to the Custom Network
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-green-600 text-white">
                <CheckCircle className="mr-1 h-3 w-3" />
                Connected
              </Badge>
              <Badge variant="outline" className="text-xs">
                {getWalletName(walletInfo.type)}
              </Badge>
            </div>
            <Button variant="outline" size="sm" onClick={disconnectWallet}>
              Disconnect
            </Button>
          </div>

          <div className="p-3 bg-white/5 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Wallet Address</p>
                <p className="text-xs text-gray-400">{walletInfo.address}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={copyAddress}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {tokenBalances.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-white">Token Balances</h3>
              <div className="space-y-1">
                {tokenBalances.map((balance, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-white/5 rounded">
                    <div>
                      <p className="text-sm font-medium text-white">{balance.tokenSymbol}</p>
                      <p className="text-xs text-gray-400">
                        Forced: ${balance.forcedPrice} | Real: ${balance.realPrice}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">
                        {balance.balance.toLocaleString()}
                      </p>
                      <p className="text-xs text-green-400">
                        ${balance.value.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Wallet className="mr-2 h-5 w-5" />
          Connect Your Wallet
        </CardTitle>
        <CardDescription className="text-gray-300">
          Connect your wallet to access the Custom Network and manage your tokens
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Your wallet will be connected to our Custom Network where you can receive and transfer tokens with zero gas fees.
          </AlertDescription>
        </Alert>

        {/* Detection Status */}
        <div className="text-center">
          <p className="text-sm text-gray-300 mb-2">
            <span className="inline-flex items-center">
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              {getDetectionStatus()}
            </span>
          </p>
          {walletService.isDeviceMobile() && (
            <p className="text-xs text-gray-400">
              If you have Trust Wallet or Bybit installed, they should appear below
            </p>
          )}
        </div>

        {/* Featured Wallets - Trust Wallet & Bybit */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Smartphone className="mr-2 h-5 w-5 text-green-400" />
            Recommended for Mobile
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availableWallets.filter(w => ['trustwallet', 'bybit'].includes(w)).map((walletType) => (
              <div key={walletType} className="space-y-2">
                <Button
                  onClick={() => connectWallet(walletType)}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full bg-gradient-to-r from-green-600/20 to-blue-600/20 border-green-400/30 text-white hover:from-green-600/30 hover:to-blue-600/30 hover:border-green-400/50"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    getWalletIcon(walletType)
                  )}
                  {getWalletName(walletType)}
                  <Badge variant="secondary" className="ml-2 bg-green-500 text-white text-xs">
                    RECOMMENDED
                  </Badge>
                </Button>
                <Button
                  onClick={() => handleSetupNetwork(walletType)}
                  disabled={isLoading}
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-green-400 hover:text-green-300"
                >
                  <Settings className="mr-1 h-3 w-3" />
                  Setup Network
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Other Wallets */}
        {availableWallets.filter(w => !['trustwallet', 'bybit'].includes(w)).length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Wallet className="mr-2 h-5 w-5 text-blue-400" />
              Other Wallet Options
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableWallets.filter(w => !['trustwallet', 'bybit'].includes(w)).map((walletType) => (
                <div key={walletType} className="space-y-2">
                  <Button
                    onClick={() => connectWallet(walletType)}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      getWalletIcon(walletType)
                    )}
                    {getWalletName(walletType)}
                  </Button>
                  {walletType !== 'manual' && (
                    <Button
                      onClick={() => handleSetupNetwork(walletType)}
                      disabled={isLoading}
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-blue-400 hover:text-blue-300"
                    >
                      <Settings className="mr-1 h-3 w-3" />
                      Setup Network
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Wallets Detected Notice */}
        {availableWallets.length === 1 && availableWallets[0] === 'manual' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No web3 wallets detected. You can still connect by entering your wallet address manually, or install a mobile wallet like Trust Wallet or Bybit Wallet for the best experience.
            </AlertDescription>
          </Alert>
        )}

        {/* Manual Input */}
        {showManualInput ? (
          <div className="space-y-2">
            <Input
              placeholder="Enter wallet address (0x...)"
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex space-x-2">
              <Button onClick={handleManualConnect} disabled={isLoading || !manualAddress.trim()}>
                Connect
              </Button>
              <Button variant="outline" onClick={() => setShowManualInput(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => setShowManualInput(true)}
            className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10"
          >
            <Wallet className="mr-2 h-4 w-4" />
            Connect Manual Address
          </Button>
        )}

        {/* QR Code */}
        <Dialog open={showQR} onOpenChange={setShowQR}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10"
              onClick={handleQRConnect}
            >
              <QrCode className="mr-2 h-4 w-4" />
              Connect with QR Code
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect with QR Code</DialogTitle>
              <DialogDescription>
                Scan this QR code with your wallet app to connect
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center p-4">
              {qrCode ? (
                <div className="bg-white p-4 rounded-lg">
                  <div className="w-48 h-48 bg-gray-200 flex items-center justify-center">
                    <QrCode className="h-32 w-32 text-gray-600" />
                  </div>
                </div>
              ) : (
                <Loader2 className="h-8 w-8 animate-spin" />
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Download Wallets */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-white">Don't have a wallet?</p>
          <div className="flex flex-wrap gap-2">
            {['metamask', 'trustwallet', 'bybit', 'phantom', 'coinbase'].map((walletType) => (
              <a
                key={walletType}
                href={getWalletDownloadLink(walletType)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300"
              >
                <Download className="h-3 w-3" />
                <span>{getWalletName(walletType)}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Network Setup Dialog */}
        <Dialog open={showNetworkDialog} onOpenChange={setShowNetworkDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                Network Setup - {getWalletName(selectedWalletType)}
              </DialogTitle>
              <DialogDescription>
                Add the Custom Network to your wallet to use our platform
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {selectedWalletType && (
                <>
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      You need to add our Custom Network to your wallet before connecting. 
                      This is a one-time setup process.
                    </AlertDescription>
                  </Alert>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Card className="bg-gray-800 border-gray-600">
                      <CardHeader>
                        <CardTitle className="text-white text-sm">Quick Setup</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Button 
                          onClick={handleAddNetwork}
                          className="w-full mb-2"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Add Network Automatically
                        </Button>
                        <p className="text-xs text-gray-400">
                          Click the button above to automatically add the network to your wallet
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-800 border-gray-600">
                      <CardHeader>
                        <CardTitle className="text-white text-sm">Network Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="text-sm">
                          <span className="text-gray-400">Network Name:</span>
                          <span className="text-white ml-2">Custom Network</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-400">Chain ID:</span>
                          <span className="text-white ml-2">1337 (0x539)</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-400">Currency:</span>
                          <span className="text-white ml-2">CETH</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-400">RPC URL:</span>
                          <span className="text-white ml-2 break-all">http://127.0.0.1:8545</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">Manual Setup Instructions</h4>
                    <ol className="text-sm text-gray-300 space-y-1">
                      {networkService.getWalletNetworkInstructions(selectedWalletType).steps.map((step, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-400 mr-2">{index + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
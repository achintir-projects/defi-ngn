'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import OffChainTokenService, { TokenBalance, TransactionRequest } from '@/lib/offChainTokenService'
import { 
  Send, 
  Receive, 
  Copy, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  Clock,
  DollarSign,
  Coins,
  ExternalLink,
  RefreshCw
} from 'lucide-react'

interface TokenTransferProps {
  walletAddress: string
  onTransferComplete?: () => void
}

interface TransferStatus {
  status: 'idle' | 'processing' | 'completed' | 'failed'
  transactionHash?: string
  error?: string
  progress: number
}

export default function TokenTransfer({ walletAddress, onTransferComplete }: TokenTransferProps) {
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([])
  const [selectedToken, setSelectedToken] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [forcedPrice, setForcedPrice] = useState('')
  const [transferStatus, setTransferStatus] = useState<TransferStatus>({
    status: 'idle',
    progress: 0
  })
  const [showConfirm, setShowConfirm] = useState(false)
  const [transferPreview, setTransferPreview] = useState<{
    tokenSymbol: string
    amount: number
    forcedPrice: number
    value: number
    fee: number
    recipient: string
  } | null>(null)
  const [recentTransfers, setRecentTransfers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  const { toast } = useToast()
  const tokenService = OffChainTokenService

  useEffect(() => {
    loadTokenBalances()
    loadRecentTransfers()
  }, [walletAddress])

  const loadTokenBalances = async () => {
    try {
      const balances = await tokenService.getAllTokenBalances(walletAddress)
      setTokenBalances(balances)
      
      // Set default selected token
      if (balances.length > 0 && !selectedToken) {
        setSelectedToken(balances[0].tokenSymbol)
        setForcedPrice(balances[0].forcedPrice.toString())
      }
    } catch (error) {
      console.error('Error loading token balances:', error)
    }
  }

  const loadRecentTransfers = async () => {
    try {
      const transactions = await tokenService.getTransactionHistory(walletAddress)
      const transfers = transactions.filter(tx => tx.type === 'transfer').slice(0, 5)
      setRecentTransfers(transfers)
    } catch (error) {
      console.error('Error loading recent transfers:', error)
    }
  }

  const handleTokenSelect = (tokenSymbol: string) => {
    setSelectedToken(tokenSymbol)
    const token = tokenBalances.find(t => t.tokenSymbol === tokenSymbol)
    if (token) {
      setForcedPrice(token.forcedPrice.toString())
    }
  }

  const validateTransfer = () => {
    if (!selectedToken) {
      toast({
        title: "No Token Selected",
        description: "Please select a token to transfer.",
        variant: "destructive",
      })
      return false
    }

    if (!recipientAddress.trim()) {
      toast({
        title: "No Recipient",
        description: "Please enter a recipient address.",
        variant: "destructive",
      })
      return false
    }

    if (!amount.trim() || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0.",
        variant: "destructive",
      })
      return false
    }

    const tokenBalance = tokenBalances.find(t => t.tokenSymbol === selectedToken)
    if (!tokenBalance || tokenBalance.balance < parseFloat(amount)) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough tokens for this transfer.",
        variant: "destructive",
      })
      return false
    }

    if (!forcedPrice.trim() || parseFloat(forcedPrice) <= 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid forced price.",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const previewTransfer = () => {
    if (!validateTransfer()) return

    const tokenBalance = tokenBalances.find(t => t.tokenSymbol === selectedToken)!
    const amountNum = parseFloat(amount)
    const forcedPriceNum = parseFloat(forcedPrice)
    const value = amountNum * forcedPriceNum
    const fee = 0 // Gasless transfer

    setTransferPreview({
      tokenSymbol: selectedToken,
      amount: amountNum,
      forcedPrice: forcedPriceNum,
      value,
      fee,
      recipient: recipientAddress.trim()
    })

    setShowConfirm(true)
  }

  const executeTransfer = async () => {
    if (!transferPreview) return

    setTransferStatus({
      status: 'processing',
      progress: 0
    })

    try {
      const request: TransactionRequest = {
        fromAddress: walletAddress,
        toAddress: transferPreview.recipient,
        tokenSymbol: transferPreview.tokenSymbol,
        amount: transferPreview.amount,
        forcedPrice: transferPreview.forcedPrice
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setTransferStatus(prev => {
          if (prev.progress >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return { ...prev, progress: prev.progress + 10 }
        })
      }, 200)

      const result = await tokenService.transferTokens(request)

      clearInterval(progressInterval)

      if (result.success) {
        setTransferStatus({
          status: 'completed',
          transactionHash: result.transactionHash,
          progress: 100
        })

        toast({
          title: "Transfer Successful",
          description: `Transferred ${transferPreview.amount} ${transferPreview.tokenSymbol} to ${transferPreview.recipient.slice(0, 6)}...${transferPreview.recipient.slice(-4)}`,
        })

        // Reset form
        setAmount('')
        setRecipientAddress('')
        setShowConfirm(false)
        setTransferPreview(null)

        // Reload data
        await loadTokenBalances()
        await loadRecentTransfers()
        
        onTransferComplete?.()
      } else {
        throw new Error(result.error || 'Transfer failed')
      }
    } catch (error) {
      console.error('Transfer error:', error)
      setTransferStatus({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Transfer failed',
        progress: 0
      })

      toast({
        title: "Transfer Failed",
        description: error instanceof Error ? error.message : "Failed to complete transfer",
        variant: "destructive",
      })
    }
  }

  const copyAddress = (address: string) => {
    // Check if we're in a browser environment with clipboard support
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(address)
      toast({
        title: "Address Copied",
        description: "Address copied to clipboard.",
      })
    } else {
      toast({
        title: "Copy Failed",
        description: "Clipboard not available in this environment.",
        variant: "destructive",
      })
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const selectedTokenBalance = tokenBalances.find(t => t.tokenSymbol === selectedToken)

  return (
    <div className="space-y-6">
      {/* Transfer Form */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Send className="mr-2 h-5 w-5" />
            Transfer Tokens
          </CardTitle>
          <CardDescription className="text-gray-300">
            Send tokens to any wallet address on the Custom Network
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Token Selection */}
          <div className="space-y-2">
            <Label htmlFor="token-select" className="text-white">Token</Label>
            <Select value={selectedToken} onValueChange={handleTokenSelect}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Select token" />
              </SelectTrigger>
              <SelectContent>
                {tokenBalances.map((balance) => (
                  <SelectItem key={balance.tokenSymbol} value={balance.tokenSymbol}>
                    <div className="flex items-center justify-between w-full">
                      <span>{balance.tokenSymbol}</span>
                      <span className="text-xs text-gray-400">
                        {balance.balance.toLocaleString()} (${balance.value.toLocaleString()})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recipient Address */}
          <div className="space-y-2">
            <Label htmlFor="recipient" className="text-white">Recipient Address</Label>
            <Input
              id="recipient"
              placeholder="0x..."
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-white">Amount</Label>
            <div className="flex space-x-2">
              <Input
                id="amount"
                type="number"
                step="0.000001"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
              {selectedTokenBalance && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(selectedTokenBalance.balance.toString())}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Max
                </Button>
              )}
            </div>
            {selectedTokenBalance && (
              <p className="text-xs text-gray-400">
                Available: {selectedTokenBalance.balance.toLocaleString()} {selectedTokenBalance.tokenSymbol}
              </p>
            )}
          </div>

          {/* Forced Price */}
          <div className="space-y-2">
            <Label htmlFor="forced-price" className="text-white">Forced Price ($)</Label>
            <Input
              id="forced-price"
              type="number"
              step="0.01"
              placeholder="2.00"
              value={forcedPrice}
              onChange={(e) => setForcedPrice(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
            />
            {selectedTokenBalance && (
              <p className="text-xs text-gray-400">
                Market Price: ${selectedTokenBalance.realPrice}
              </p>
            )}
          </div>

          {/* Transfer Button */}
          <Button
            onClick={previewTransfer}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Preview Transfer
          </Button>
        </CardContent>
      </Card>

      {/* Transfer Status */}
      {transferStatus.status !== 'idle' && (
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">
                  {transferStatus.status === 'processing' && 'Processing Transfer...'}
                  {transferStatus.status === 'completed' && 'Transfer Completed!'}
                  {transferStatus.status === 'failed' && 'Transfer Failed'}
                </span>
                {transferStatus.status === 'processing' && (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                )}
                {transferStatus.status === 'completed' && (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                )}
                {transferStatus.status === 'failed' && (
                  <AlertCircle className="h-4 w-4 text-red-400" />
                )}
              </div>

              {transferStatus.status === 'processing' && (
                <Progress value={transferStatus.progress} className="w-full" />
              )}

              {transferStatus.status === 'completed' && transferStatus.transactionHash && (
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <p className="text-xs text-green-400">
                    Transaction Hash: {transferStatus.transactionHash}
                  </p>
                </div>
              )}

              {transferStatus.status === 'failed' && transferStatus.error && (
                <Alert variant="destructive">
                  <AlertDescription>{transferStatus.error}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Transfers */}
      {recentTransfers.length > 0 && (
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Recent Transfers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentTransfers.map((transfer, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded">
                  <div className="flex items-center space-x-2">
                    <Badge variant={transfer.status === 'completed' ? 'default' : 'secondary'}>
                      {transfer.status === 'completed' ? 'Completed' : transfer.status}
                    </Badge>
                    <span className="text-sm text-white">
                      {transfer.amount} {transfer.tokenSymbol}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400">
                      {formatAddress(transfer.toAddress)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyAddress(transfer.toAddress)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="bg-white/10 backdrop-blur-sm border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white">Confirm Transfer</DialogTitle>
            <DialogDescription className="text-gray-300">
              Please review your transfer details before confirming
            </DialogDescription>
          </DialogHeader>
          {transferPreview && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Token</p>
                  <p className="text-white font-medium">{transferPreview.tokenSymbol}</p>
                </div>
                <div>
                  <p className="text-gray-400">Amount</p>
                  <p className="text-white font-medium">{transferPreview.amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-400">Forced Price</p>
                  <p className="text-white font-medium">${transferPreview.forcedPrice}</p>
                </div>
                <div>
                  <p className="text-gray-400">Total Value</p>
                  <p className="text-white font-medium">${transferPreview.value.toLocaleString()}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-400">Recipient</p>
                  <p className="text-white font-medium">{transferPreview.recipient}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-400">Network Fee</p>
                  <p className="text-green-400 font-medium">Free (Gasless)</p>
                </div>
              </div>

              <Alert>
                <DollarSign className="h-4 w-4" />
                <AlertDescription>
                  This transfer uses your forced price of ${transferPreview.forcedPrice} instead of the market price.
                  The recipient will receive {transferPreview.amount} {transferPreview.tokenSymbol} valued at ${transferPreview.value} in your system.
                </AlertDescription>
              </Alert>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={executeTransfer}
                  disabled={transferStatus.status === 'processing'}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {transferStatus.status === 'processing' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Confirm Transfer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
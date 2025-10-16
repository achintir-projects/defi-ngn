'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Coins, AlertCircle, CheckCircle } from 'lucide-react'

export default function TokenInjectionTest() {
  const [formData, setFormData] = useState({
    tokenSymbol: 'USDT',
    amount: '1000',
    forcedPrice: '2.0',
    walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f8d9B3'
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)
  
  const { toast } = useToast()

  const handleInject = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/tokens/inject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenSymbol: formData.tokenSymbol,
          amount: parseFloat(formData.amount),
          forcedPrice: parseFloat(formData.forcedPrice),
          targetWallets: [formData.walletAddress],
          isGasless: true,
          adminId: 'test_admin'
        })
      })

      const data = await response.json()
      setResult(data)

      if (data.success) {
        toast({
          title: "Injection Successful",
          description: `Successfully injected ${formData.amount} ${formData.tokenSymbol} tokens!`,
        })
      } else {
        throw new Error(data.error || 'Injection failed')
      }
    } catch (error) {
      console.error('Injection error:', error)
      toast({
        title: "Injection Failed",
        description: error instanceof Error ? error.message : "Failed to inject tokens",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Coins className="mr-2 h-5 w-5" />
            Token Injection Test
          </CardTitle>
          <CardDescription>
            Test the USDT token injection functionality with forced pricing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tokenSymbol">Token Symbol</Label>
              <Select value={formData.tokenSymbol} onValueChange={(value) => setFormData({...formData, tokenSymbol: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USDT">USDT (ERC20)</SelectItem>
                  <SelectItem value="USDT_TRC20">USDT (TRC20)</SelectItem>
                  <SelectItem value="ETH">ETH</Item>
                  <SelectItem value="CUSTOM">CUSTOM</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                placeholder="1000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="forcedPrice">Forced Price ($)</Label>
              <Input
                id="forcedPrice"
                type="number"
                step="0.01"
                value={formData.forcedPrice}
                onChange={(e) => setFormData({...formData, forcedPrice: e.target.value})}
                placeholder="2.0"
              />
            </div>
            <div>
              <Label htmlFor="walletAddress">Wallet Address</Label>
              <Input
                id="walletAddress"
                value={formData.walletAddress}
                onChange={(e) => setFormData({...formData, walletAddress: e.target.value})}
                placeholder="0x..."
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Injection Summary</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>Token: {formData.tokenSymbol}</p>
              <p>Amount: {formData.amount}</p>
              <p>Forced Price: ${formData.forcedPrice}</p>
              <p>Total Value: ${(parseFloat(formData.amount) * parseFloat(formData.forcedPrice)).toFixed(2)}</p>
              <p>Target: {formData.walletAddress.slice(0, 6)}...{formData.walletAddress.slice(-4)}</p>
            </div>
          </div>

          <Button 
            onClick={handleInject} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Injecting...' : 'Inject Tokens'}
          </Button>

          {result && (
            <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={result.success ? "text-green-800" : "text-red-800"}>
                <div className="font-medium">
                  {result.success ? "✅ Injection Successful!" : "❌ Injection Failed"}
                </div>
                {result.success ? (
                  <div className="mt-2 text-sm">
                    <p>Job ID: {result.injectionJob?.id}</p>
                    <p>Status: {result.injectionJob?.status}</p>
                    <p>Target Wallets: {result.injectionJob?.targetWallets}</p>
                    <p>Total Value: ${result.injectionJob?.totalValue}</p>
                  </div>
                ) : (
                  <div className="mt-2 text-sm">
                    Error: {result.error}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
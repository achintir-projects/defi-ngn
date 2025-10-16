'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Chrome, Shield, Lock, Eye, EyeOff } from 'lucide-react'

export default function AdminAuth() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authMethod, setAuthMethod] = useState<'google' | 'password'>('google')
  
  const { toast } = useToast()

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      // Simulate Google OAuth login
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Store admin session
      localStorage.setItem('admin_auth', JSON.stringify({
        isAuthenticated: true,
        method: 'google',
        email: 'admin@example.com',
        timestamp: Date.now()
      }))
      
      toast({
        title: "Login Successful",
        description: "Welcome to the Admin Dashboard",
      })
      
      // Redirect to admin dashboard
      window.location.href = '/admin'
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Failed to authenticate with Google",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      // Simulate password authentication
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Simple demo credentials - in production, use proper authentication
      if (email === 'admin@example.com' && password === 'admin123') {
        localStorage.setItem('admin_auth', JSON.stringify({
          isAuthenticated: true,
          method: 'password',
          email: email,
          timestamp: Date.now()
        }))
        
        toast({
          title: "Login Successful",
          description: "Welcome to the Admin Dashboard",
        })
        
        // Redirect to admin dashboard
        window.location.href = '/admin'
      } else {
        throw new Error('Invalid credentials')
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Invalid email or password",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Portal</h1>
          <p className="text-gray-300">Secure access to platform administration</p>
        </div>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Administrator Login</CardTitle>
            <CardDescription className="text-gray-300">
              Choose your preferred authentication method
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Auth Method Toggle */}
            <div className="flex space-x-2 bg-white/5 rounded-lg p-1">
              <Button
                variant={authMethod === 'google' ? 'default' : 'ghost'}
                className="flex-1"
                onClick={() => setAuthMethod('google')}
              >
                <Chrome className="mr-2 h-4 w-4" />
                Google
              </Button>
              <Button
                variant={authMethod === 'password' ? 'default' : 'ghost'}
                className="flex-1"
                onClick={() => setAuthMethod('password')}
              >
                <Lock className="mr-2 h-4 w-4" />
                Password
              </Button>
            </div>

            {/* Google Login */}
            {authMethod === 'google' && (
              <div className="space-y-4">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Sign in with your Google account for secure, passwordless access to the admin dashboard.
                  </AlertDescription>
                </Alert>
                
                <Button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full bg-white text-gray-900 hover:bg-gray-100"
                >
                  {isLoading ? (
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
                  ) : (
                    <Chrome className="mr-2 h-4 w-4" />
                  )}
                  Sign in with Google
                </Button>
              </div>
            )}

            {/* Password Login */}
            {authMethod === 'password' && (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Use your administrator credentials to access the dashboard.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white mb-2 block">Email</label>
                  <Input
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white mb-2 block">Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Lock className="mr-2 h-4 w-4" />
                  )}
                  Sign In
                </Button>
              </form>
            )}

            {/* Demo Credentials Notice */}
            <div className="text-xs text-gray-400 text-center">
              <p>Demo Credentials:</p>
              <p>Email: admin@example.com</p>
              <p>Password: admin123</p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Button
            variant="link"
            className="text-gray-400 hover:text-white"
            onClick={() => window.location.href = '/'}
          >
            ← Back to Main Platform
          </Button>
        </div>
      </div>
    </div>
  )
}
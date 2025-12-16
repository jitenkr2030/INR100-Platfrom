'use client'

import React, { useState, useEffect } from 'react'
import { CreditCard, Smartphone, Building, Wallet, Lock, AlertCircle, Check, RefreshCw } from 'lucide-react'

interface PaymentGateway {
  id: string
  name: string
  supportedMethods: string[]
  supportedCurrencies: string[]
  processingFee: number
}

interface PaymentMethod {
  id: string
  type: 'card' | 'bank_transfer' | 'wallet' | 'upi' | 'netbanking'
  brand?: string
  last4?: string
  expiryMonth?: number
  expiryYear?: number
  bankName?: string
  walletName?: string
  upiId?: string
}

interface PaymentFormProps {
  amount: number
  currency: string
  description: string
  customerId?: string
  subscriptionId?: string
  onSuccess: (paymentResult: any) => void
  onError: (error: string) => void
  allowSaveCard?: boolean
}

export default function PaymentForm({
  amount,
  currency,
  description,
  customerId,
  subscriptionId,
  onSuccess,
  onError,
  allowSaveCard = true,
}: PaymentFormProps) {
  const [gateways, setGateways] = useState<PaymentGateway[]>([])
  const [selectedGateway, setSelectedGateway] = useState<string>('stripe')
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchGateways()
    if (customerId) {
      fetchSavedPaymentMethods()
    }
  }, [customerId])

  const fetchGateways = async () => {
    try {
      const response = await fetch('/api/payments/gateways')
      const data = await response.json()
      if (response.ok) {
        setGateways(data.gateways)
      }
    } catch (err) {
      console.error('Failed to fetch gateways:', err)
    }
  }

  const fetchSavedPaymentMethods = async () => {
    // This would fetch saved payment methods for the customer
    // For now, we'll use mock data
    setPaymentMethods([
      {
        id: 'pm_123',
        type: 'card',
        brand: 'visa',
        last4: '4242',
        expiryMonth: 12,
        expiryYear: 2026,
      },
      {
        id: 'pm_456',
        type: 'card',
        brand: 'mastercard',
        last4: '1234',
        expiryMonth: 8,
        expiryYear: 2025,
      },
    ])
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setProcessing(true)
    setError(null)

    try {
      const response = await fetch('/api/payments/gateways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency,
          gateway: selectedGateway,
          customerId,
          description,
          paymentMethodId: selectedPaymentMethod,
          metadata: {
            subscriptionId,
            description,
          },
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        if (data.clientSecret) {
          // Handle Stripe payment confirmation
          // This would integrate with Stripe Elements
          onSuccess(data)
        } else {
          // Handle other gateway redirects
          if (data.redirectUrl) {
            window.location.href = data.redirectUrl
          } else {
            onSuccess(data)
          }
        }
      } else {
        setError(data.error)
        onError(data.error)
      }
    } catch (err: any) {
      const errorMessage = 'Payment processing failed'
      setError(errorMessage)
      onError(errorMessage)
    } finally {
      setProcessing(false)
    }
  }

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'card':
        return <CreditCard className="h-5 w-5" />
      case 'wallet':
        return <Wallet className="h-5 w-5" />
      case 'upi':
        return <Smartphone className="h-5 w-5" />
      case 'netbanking':
      case 'bank_transfer':
        return <Building className="h-5 w-5" />
      default:
        return <CreditCard className="h-5 w-5" />
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount)
  }

  const selectedGatewayData = gateways.find(g => g.id === selectedGateway)
  const totalAmount = amount + (amount * (selectedGatewayData?.processingFee || 0))

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Complete Payment</h2>
        <p className="text-gray-600 mt-1">{description}</p>
        <div className="text-3xl font-bold text-gray-900 mt-2">
          {formatCurrency(totalAmount, currency)}
        </div>
        {selectedGatewayData && selectedGatewayData.processingFee > 0 && (
          <p className="text-sm text-gray-500 mt-1">
            Includes {formatCurrency(amount * selectedGatewayData.processingFee, currency)} processing fee
          </p>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Gateway Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Payment Method
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {gateways.map((gateway) => (
              <button
                key={gateway.id}
                type="button"
                onClick={() => setSelectedGateway(gateway.id)}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  selectedGateway === gateway.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="font-medium text-gray-900">{gateway.name}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {gateway.supportedMethods.join(', ')}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Fee: {(gateway.processingFee * 100).toFixed(1)}%
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Saved Payment Methods */}
        {paymentMethods.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Saved Payment Methods
            </label>
            <div className="space-y-2">
              {paymentMethods.map((method) => (
                <label
                  key={method.id}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedPaymentMethod === method.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.id}
                    checked={selectedPaymentMethod === method.id}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="text-gray-600">
                      {getMethodIcon(method.type)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {method.type === 'card' && `${method.brand?.toUpperCase()} ****${method.last4}`}
                        {method.type === 'wallet' && method.walletName}
                        {method.type === 'upi' && `UPI: ${method.upiId}`}
                        {method.type === 'netbanking' && method.bankName}
                      </div>
                      {method.type === 'card' && method.expiryMonth && method.expiryYear && (
                        <div className="text-sm text-gray-500">
                          Expires {method.expiryMonth}/{method.expiryYear}
                        </div>
                      )}
                    </div>
                    {selectedPaymentMethod === method.id && (
                      <Check className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Add New Payment Method */}
        <div className="border-t pt-6">
          <button
            type="button"
            onClick={() => {/* Handle add new payment method */}}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
          >
            <div className="flex items-center justify-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Add New Payment Method</span>
            </div>
          </button>
        </div>

        {/* Security Notice */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Lock className="h-4 w-4" />
            <span>Your payment information is secure and encrypted</span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={processing || !selectedPaymentMethod}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            processing || !selectedPaymentMethod
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {processing ? (
            <div className="flex items-center justify-center space-x-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Processing Payment...</span>
            </div>
          ) : (
            `Pay ${formatCurrency(totalAmount, currency)}`
          )}
        </button>

        {/* Terms */}
        <p className="text-xs text-gray-500 text-center">
          By completing this payment, you agree to our{' '}
          <a href="/terms" className="text-blue-600 hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-blue-600 hover:underline">
            Privacy Policy
          </a>
        </p>
      </form>
    </div>
  )
}

// Payment Summary Component
export function PaymentSummary({
  amount,
  currency,
  gateway,
  processingFee,
}: {
  amount: number
  currency: string
  gateway: string
  processingFee: number
}) {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount)
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
      <div className="flex justify-between text-sm">
        <span>Subtotal</span>
        <span>{formatCurrency(amount, currency)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>Processing Fee</span>
        <span>{formatCurrency(amount * processingFee, currency)}</span>
      </div>
      <div className="border-t pt-2 flex justify-between font-semibold">
        <span>Total</span>
        <span>{formatCurrency(amount + (amount * processingFee), currency)}</span>
      </div>
      <div className="text-xs text-gray-500">
        Processed by {gateway}
      </div>
    </div>
  )
}

// Quick Payment Button Component
export function QuickPaymentButton({
  amount,
  currency,
  description,
  onSuccess,
  onError,
  className = '',
}: {
  amount: number
  currency: string
  description: string
  onSuccess: (result: any) => void
  onError: (error: string) => void
  className?: string
}) {
  const [loading, setLoading] = useState(false)

  const handleQuickPay = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/payments/gateways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency,
          gateway: 'stripe',
          description,
          useDefaultPaymentMethod: true,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        onSuccess(data)
      } else {
        onError(data.error)
      }
    } catch (err) {
      onError('Payment failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleQuickPay}
      disabled={loading}
      className={`inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 ${className}`}
    >
      {loading ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : (
        <CreditCard className="h-4 w-4" />
      )}
      <span>Quick Pay</span>
    </button>
  )
}
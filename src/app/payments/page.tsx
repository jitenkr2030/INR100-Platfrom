'use client'

import React, { useState } from 'react'
import { CreditCard, Receipt, RefreshCw, Settings, AlertCircle, Check, DollarSign } from 'lucide-react'
import SubscriptionManagement from '@/components/payments/SubscriptionManagement'
import PaymentForm from '@/components/payments/PaymentForm'

interface PaymentHistory {
  id: string
  amount: number
  currency: string
  status: 'succeeded' | 'pending' | 'failed' | 'refunded'
  description: string
  createdAt: string
  gateway: string
  refundId?: string
}

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'subscriptions' | 'billing' | 'methods'>('overview')
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentHistory] = useState<PaymentHistory[]>([
    {
      id: 'pi_123',
      amount: 29.99,
      currency: 'usd',
      status: 'succeeded',
      description: 'Monthly Subscription - Pro Plan',
      createdAt: '2025-01-10T10:30:00Z',
      gateway: 'Stripe',
    },
    {
      id: 'pi_124',
      amount: 29.99,
      currency: 'usd',
      status: 'succeeded',
      description: 'Monthly Subscription - Pro Plan',
      createdAt: '2025-01-10T10:30:00Z',
      gateway: 'Stripe',
    },
    {
      id: 'pi_125',
      amount: 15.00,
      currency: 'usd',
      status: 'failed',
      description: 'Add-on Purchase - Extra Storage',
      createdAt: '2025-01-09T14:15:00Z',
      gateway: 'Stripe',
    },
  ])

  const tabs = [
    { id: 'overview', label: 'Overview', icon: DollarSign },
    { id: 'subscriptions', label: 'Subscriptions', icon: RefreshCw },
    { id: 'billing', label: 'Billing History', icon: Receipt },
    { id: 'methods', label: 'Payment Methods', icon: CreditCard },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'text-green-600 bg-green-100'
      case 'pending':
        return 'text-yellow-600 bg-yellow-100'
      case 'failed':
        return 'text-red-600 bg-red-100'
      case 'refunded':
        return 'text-blue-600 bg-blue-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <Check className="h-4 w-4" />
      case 'failed':
        return <AlertCircle className="h-4 w-4" />
      case 'pending':
        return <RefreshCw className="h-4 w-4 animate-spin" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount)
  }

  const handlePaymentSuccess = (result: any) => {
    console.log('Payment successful:', result)
    setShowPaymentForm(false)
    // Refresh payment history
    window.location.reload()
  }

  const handlePaymentError = (error: string) => {
    console.error('Payment failed:', error)
    alert(`Payment failed: ${error}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payments & Billing</h1>
              <p className="text-gray-600 mt-1">Manage your subscriptions, payment methods, and billing history</p>
            </div>
            <button
              onClick={() => setShowPaymentForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Make Payment
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">This Month</p>
                <p className="text-2xl font-bold text-gray-900">$59.98</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <RefreshCw className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Subscriptions</p>
                <p className="text-2xl font-bold text-gray-900">2</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Methods</p>
                <p className="text-2xl font-bold text-gray-900">3</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Failed Payments</p>
                <p className="text-2xl font-bold text-gray-900">1</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Recent Activity */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    {paymentHistory.slice(0, 5).map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 rounded-full ${getStatusColor(payment.status)}`}>
                            {getStatusIcon(payment.status)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{payment.description}</div>
                            <div className="text-sm text-gray-500">
                              {new Date(payment.createdAt).toLocaleDateString()} • {payment.gateway}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">
                            {formatCurrency(payment.amount, payment.currency)}
                          </div>
                          <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                            {getStatusIcon(payment.status)}
                            <span className="capitalize">{payment.status}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setShowPaymentForm(true)}
                    className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <CreditCard className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <div className="font-medium text-gray-900">Make a Payment</div>
                    <div className="text-sm text-gray-500">Process a new payment</div>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('subscriptions')}
                    className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <RefreshCw className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <div className="font-medium text-gray-900">Manage Subscriptions</div>
                    <div className="text-sm text-gray-500">View and modify plans</div>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('methods')}
                    className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <Settings className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <div className="font-medium text-gray-900">Payment Settings</div>
                    <div className="text-sm text-gray-500">Update payment methods</div>
                  </button>
                </div>
              </div>
            )}

            {/* Subscriptions Tab */}
            {activeTab === 'subscriptions' && (
              <SubscriptionManagement />
            )}

            {/* Billing History Tab */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Billing History</h3>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                      Export CSV
                    </button>
                    <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                      Download All
                    </button>
                  </div>
                </div>

                <div className="overflow-hidden border rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Transaction
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Gateway
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paymentHistory.map((payment) => (
                        <tr key={payment.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {payment.description}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {payment.id}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(payment.amount, payment.currency)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                              {getStatusIcon(payment.status)}
                              <span className="capitalize">{payment.status}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payment.gateway}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button className="text-blue-600 hover:text-blue-900">
                              View
                            </button>
                            {payment.status === 'succeeded' && (
                              <button className="text-red-600 hover:text-red-900">
                                Refund
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Payment Methods Tab */}
            {activeTab === 'methods' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Payment Methods</h3>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Add Payment Method
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Saved Payment Methods */}
                  <div className="border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">Saved Cards</h4>
                      <span className="text-sm text-gray-500">2 cards</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded"></div>
                          <div>
                            <div className="font-medium">**** **** **** 4242</div>
                            <div className="text-sm text-gray-500">Expires 12/26</div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-800 text-sm">
                            Edit
                          </button>
                          <button className="text-red-600 hover:text-red-800 text-sm">
                            Remove
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-6 bg-gradient-to-r from-red-500 to-yellow-500 rounded"></div>
                          <div>
                            <div className="font-medium">**** **** **** 1234</div>
                            <div className="text-sm text-gray-500">Expires 08/25</div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-800 text-sm">
                            Edit
                          </button>
                          <button className="text-red-600 hover:text-red-800 text-sm">
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Failed Payment Alert */}
                  <div className="border rounded-lg p-6 bg-orange-50 border-orange-200">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-orange-900">Action Required</h4>
                        <p className="text-orange-700 text-sm mt-1">
                          One of your payment methods has failed. Please update your card information to continue receiving service.
                        </p>
                        <button className="mt-3 px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700">
                          Update Now
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment Form Modal */}
        {showPaymentForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Process Payment</h2>
                  <button
                    onClick={() => setShowPaymentForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <PaymentForm
                  amount={29.99}
                  currency="usd"
                  description="Monthly Subscription - Pro Plan"
                  customerId="cus_123"
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
'use client'

import React, { useState, useEffect } from 'react'
import { CreditCard, Calendar, DollarSign, Download, RefreshCw, AlertCircle, Check, X } from 'lucide-react'

interface Subscription {
  id: string
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing'
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  plan: {
    name: string
    price: number
    currency: string
    interval: 'month' | 'year'
  }
  paymentMethod?: {
    type: string
    last4: string
    brand: string
    expiryMonth: number
    expiryYear: number
  }
}

interface Invoice {
  id: string
  amount: number
  currency: string
  status: 'paid' | 'open' | 'void' | 'uncollectible'
  dueDate: string
  paidAt?: string
  invoiceUrl: string
  pdfUrl: string
  description: string
}

export default function SubscriptionManagement() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState<'overview' | 'billing' | 'payment-methods'>('overview')

  useEffect(() => {
    fetchSubscriptions()
    fetchInvoices()
  }, [])

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('/api/subscriptions/manage?customerId=cus_123')
      const data = await response.json()
      if (response.ok) {
        setSubscriptions(data.subscriptions || [])
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to fetch subscriptions')
    } finally {
      setLoading(false)
    }
  }

  const fetchInvoices = async () => {
    try {
      const response = await fetch('/api/invoices/manage?customerId=cus_123&limit=10')
      const data = await response.json()
      if (response.ok) {
        setInvoices(data.invoices || [])
      }
    } catch (err) {
      console.error('Failed to fetch invoices:', err)
    }
  }

  const cancelSubscription = async (subscriptionId: string) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) return

    try {
      const response = await fetch('/api/subscriptions/manage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId,
          cancelAtPeriodEnd: true,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        alert('Subscription will be canceled at the end of the current billing period')
        fetchSubscriptions()
      } else {
        alert(data.error)
      }
    } catch (err) {
      alert('Failed to cancel subscription')
    }
  }

  const resumeSubscription = async (subscriptionId: string) => {
    try {
      const response = await fetch('/api/subscriptions/manage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId,
          cancelAtPeriodEnd: false,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        alert('Subscription resumed successfully')
        fetchSubscriptions()
      } else {
        alert(data.error)
      }
    } catch (err) {
      alert('Failed to resume subscription')
    }
  }

  const downloadInvoice = (pdfUrl: string, invoiceId: string) => {
    const link = document.createElement('a')
    link.href = pdfUrl
    link.download = `invoice-${invoiceId}.pdf`
    link.click()
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'paid':
      case 'trialing':
        return 'text-green-600 bg-green-100'
      case 'canceled':
      case 'void':
        return 'text-red-600 bg-red-100'
      case 'past_due':
      case 'uncollectible':
        return 'text-orange-600 bg-orange-100'
      case 'open':
      case 'incomplete':
        return 'text-yellow-600 bg-yellow-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'paid':
      case 'trialing':
        return <Check className="h-4 w-4" />
      case 'canceled':
      case 'void':
        return <X className="h-4 w-4" />
      case 'past_due':
      case 'uncollectible':
      case 'open':
      case 'incomplete':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <RefreshCw className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Subscription Management</h2>
        <p className="text-gray-600">Manage your subscriptions, billing, and payment methods</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: Calendar },
              { id: 'billing', label: 'Billing & Invoices', icon: DollarSign },
              { id: 'payment-methods', label: 'Payment Methods', icon: CreditCard },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    selectedTab === tab.id
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
          {selectedTab === 'overview' && (
            <div className="space-y-6">
              {/* Current Subscriptions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Subscriptions</h3>
                {subscriptions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No active subscriptions</p>
                    <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Browse Plans
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {subscriptions.map((subscription) => (
                      <div key={subscription.id} className="border rounded-lg p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-lg font-semibold text-gray-900">
                                {subscription.plan.name}
                              </h4>
                              <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
                                {getStatusIcon(subscription.status)}
                                <span className="capitalize">{subscription.status.replace('_', ' ')}</span>
                              </span>
                              {subscription.cancelAtPeriodEnd && (
                                <span className="text-orange-600 bg-orange-100 px-2 py-1 rounded-full text-xs font-medium">
                                  Cancels at period end
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Price:</span>{' '}
                                {formatCurrency(subscription.plan.price, subscription.plan.currency)}/{subscription.plan.interval}
                              </div>
                              <div>
                                <span className="font-medium">Current period:</span>{' '}
                                {new Date(subscription.currentPeriodStart).toLocaleDateString()} - {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                              </div>
                              <div>
                                <span className="font-medium">Next billing:</span>{' '}
                                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            {subscription.cancelAtPeriodEnd ? (
                              <button
                                onClick={() => resumeSubscription(subscription.id)}
                                className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
                              >
                                Resume
                              </button>
                            ) : (
                              <button
                                onClick={() => cancelSubscription(subscription.id)}
                                className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Billing Tab */}
          {selectedTab === 'billing' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Billing History</h3>
                <button
                  onClick={() => window.open('/api/invoices/manage?customerId=cus_123&download=all', '_blank')}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Download className="h-4 w-4" />
                  <span>Download All</span>
                </button>
              </div>

              {invoices.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No invoices found</p>
                </div>
              ) : (
                <div className="overflow-hidden border rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Invoice
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
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invoices.map((invoice) => (
                        <tr key={invoice.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              #{invoice.id.slice(-8)}
                            </div>
                            <div className="text-sm text-gray-500">{invoice.description}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(invoice.amount, invoice.currency)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                              {getStatusIcon(invoice.status)}
                              <span className="capitalize">{invoice.status}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {invoice.paidAt 
                              ? new Date(invoice.paidAt).toLocaleDateString()
                              : new Date(invoice.dueDate).toLocaleDateString()
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => window.open(invoice.invoiceUrl, '_blank')}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View
                            </button>
                            <button
                              onClick={() => downloadInvoice(invoice.pdfUrl, invoice.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Download
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Payment Methods Tab */}
          {selectedTab === 'payment-methods' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Payment Methods</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Add Payment Method
                </button>
              </div>

              {/* Payment Method Card */}
              <div className="border rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">•••• •••• •••• 4242</div>
                      <div className="text-sm text-gray-500">Expires 12/26</div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                      Edit
                    </button>
                    <button className="px-3 py-1 border border-red-300 text-red-600 rounded text-sm hover:bg-red-50">
                      Remove
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex items-center space-x-2 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  <span>Default payment method</span>
                </div>
              </div>

              {/* Failed Payment Alert */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="text-orange-900 font-medium">Payment Failed</h4>
                    <p className="text-orange-700 text-sm mt-1">
                      Your recent payment attempt failed. Please update your payment method to continue your subscription.
                    </p>
                    <button className="mt-3 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm">
                      Update Payment Method
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
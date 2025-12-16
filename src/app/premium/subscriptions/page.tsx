'use client';

import React, { useState, useEffect } from 'react';
import {
  Crown,
  Check,
  X,
  Star,
  Gift,
  CreditCard,
  Calendar,
  Download,
  BookOpen,
  Users,
  Award,
  TrendingUp,
  ArrowRight,
  Zap,
  Shield,
  HeadphonesIcon,
  Sparkles
} from 'lucide-react';

interface PremiumPlan {
  id: string;
  name: string;
  price: number;
  billing: 'monthly' | 'yearly';
  features: string[];
  popular?: boolean;
  savings?: number;
}

interface UserSubscription {
  id: string;
  plan: string;
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'PAST_DUE';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  price: number;
  features: string[];
}

const premiumPlans: PremiumPlan[] = [
  {
    id: 'basic',
    name: 'Premium Basic',
    price: 29,
    billing: 'monthly',
    features: [
      'Access to 500+ premium courses',
      'Expert mentorship sessions',
      'Downloadable resources',
      'Progress tracking',
      'Mobile app access',
      'Email support'
    ]
  },
  {
    id: 'pro',
    name: 'Premium Pro',
    price: 59,
    billing: 'monthly',
    popular: true,
    features: [
      'Everything in Basic',
      'Unlimited premium courses',
      '1-on-1 coaching sessions',
      'Advanced analytics',
      'Priority support',
      'Certificate of completion',
      'Career guidance',
      'Networking events'
    ]
  },
  {
    id: 'enterprise',
    name: 'Premium Enterprise',
    price: 199,
    billing: 'monthly',
    features: [
      'Everything in Pro',
      'Custom learning paths',
      'Dedicated account manager',
      'API access',
      'White-label options',
      'Advanced reporting',
      'SLA guarantee',
      'On-premise deployment'
    ],
    savings: 25
  }
];

export default function PremiumSubscriptions() {
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('pro');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserSubscription();
  }, []);

  const fetchUserSubscription = async () => {
    try {
      // Simulate API call
      setTimeout(() => {
        setUserSubscription({
          id: 'sub_123',
          plan: 'pro',
          status: 'ACTIVE',
          currentPeriodStart: '2024-01-01',
          currentPeriodEnd: '2024-02-01',
          cancelAtPeriodEnd: false,
          price: 59,
          features: [
            'Everything in Basic',
            'Unlimited premium courses',
            '1-on-1 coaching sessions',
            'Advanced analytics',
            'Priority support',
            'Certificate of completion',
            'Career guidance',
            'Networking events'
          ]
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setLoading(false);
    }
  };

  const handleUpgrade = (planId: string) => {
    setSelectedPlan(planId);
    setShowPaymentModal(true);
  };

  const handleCancelSubscription = async () => {
    if (window.confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      // Handle cancellation
      alert('Subscription cancellation requested. You will retain access until the end of your billing period.');
    }
  };

  const PlanCard = ({ plan, isCurrent = false }: { plan: PremiumPlan; isCurrent?: boolean }) => (
    <div className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
      plan.popular ? 'border-blue-500 scale-105' : 'border-gray-200 hover:border-blue-300'
    }`}>
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center">
            <Star className="w-4 h-4 mr-1" />
            Most Popular
          </div>
        </div>
      )}
      
      <div className="p-8">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
          <div className="mb-4">
            <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
            <span className="text-gray-600">/{plan.billing}</span>
            {plan.savings && (
              <div className="text-sm text-green-600 font-medium">
                Save {plan.savings}% annually
              </div>
            )}
          </div>
        </div>

        <ul className="space-y-3 mb-8">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>

        <div className="text-center">
          {isCurrent ? (
            <div className="space-y-3">
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-medium">
                Current Plan
              </div>
              <button
                onClick={handleCancelSubscription}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Cancel Subscription
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleUpgrade(plan.id)}
              className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                plan.popular
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}
            >
              {userSubscription ? 'Upgrade to ' + plan.name : 'Get Started'}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Crown className="w-16 h-16 text-yellow-300" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Premium Subscriptions</h1>
            <p className="text-xl text-blue-100 mb-8">
              Unlock unlimited learning and accelerate your career growth
            </p>
            
            {/* Current Subscription Status */}
            {userSubscription && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 max-w-md mx-auto">
                <div className="flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-yellow-300 mr-2" />
                  <span className="font-semibold">Active Subscription</span>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold mb-2">
                    Premium {userSubscription.plan.charAt(0).toUpperCase() + userSubscription.plan.slice(1)}
                  </div>
                  <div className="text-blue-100 mb-4">
                    ${userSubscription.price}/{userSubscription.status === 'ACTIVE' ? 'month' : 'year'}
                  </div>
                  <div className="text-sm text-blue-200">
                    Next billing: {new Date(userSubscription.currentPeriodEnd).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Features Grid */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Why Choose Premium?
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            Get access to exclusive content and features designed for serious learners
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: BookOpen,
                title: 'Premium Content',
                description: 'Access 1000+ expert-created courses'
              },
              {
                icon: Users,
                title: 'Expert Mentorship',
                description: '1-on-1 guidance from industry experts'
              },
              {
                icon: Award,
                title: 'Certificates',
                description: 'Industry-recognized certifications'
              },
              {
                icon: TrendingUp,
                title: 'Advanced Analytics',
                description: 'Track your progress with detailed insights'
              }
            ].map((feature, index) => (
              <div key={index} className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Plan</h2>
          <p className="text-xl text-gray-600">
            Select the perfect plan for your learning journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {premiumPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrent={userSubscription?.plan === plan.id}
            />
          ))}
        </div>

        {/* Enterprise Section */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white text-center">
          <div className="max-w-3xl mx-auto">
            <Shield className="w-16 h-16 mx-auto mb-6 text-purple-200" />
            <h2 className="text-3xl font-bold mb-4">Need Something Custom?</h2>
            <p className="text-xl text-purple-100 mb-8">
              Get a personalized learning solution designed for your organization's unique needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors">
                Contact Sales
              </button>
              <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors">
                View Demo
              </button>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                question: 'Can I change my plan anytime?',
                answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately and billing is prorated.'
              },
              {
                question: 'What payment methods do you accept?',
                answer: 'We accept all major credit cards, PayPal, and bank transfers for enterprise customers.'
              },
              {
                question: 'Is there a free trial?',
                answer: 'Yes, all premium plans come with a 14-day free trial. No credit card required to start.'
              },
              {
                question: 'Can I cancel anytime?',
                answer: 'Absolutely. You can cancel your subscription at any time and you\'ll retain access until the end of your billing period.'
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Complete Payment</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-gray-900">
                  {premiumPlans.find(p => p.id === selectedPlan)?.name}
                </h4>
                <p className="text-gray-600">
                  ${premiumPlans.find(p => p.id === selectedPlan)?.price}/
                  {premiumPlans.find(p => p.id === selectedPlan)?.billing}
                </p>
              </div>
              
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Card Number"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="CVV"
                    className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Cardholder Name"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  alert('Payment successful! Welcome to Premium.');
                }}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Complete Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
"use client"

import { useState, useEffect } from 'react'

interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  isVerified: boolean
  subscriptionTier: string
}

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const user = await response.json()
          setAuthState({
            user,
            loading: false,
            error: null
          })
        } else {
          setAuthState({
            user: null,
            loading: false,
            error: null
          })
        }
      } catch (error) {
        setAuthState({
          user: null,
          loading: false,
          error: 'Failed to check authentication status'
        })
      }
    }

    checkAuth()
  }, [])

  const login = async (credentials: { email?: string; phone?: string; password: string }) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      })

      if (response.ok) {
        const data = await response.json()
        setAuthState({
          user: data.user,
          loading: false,
          error: null
        })
        return { success: true, data }
      } else {
        const error = await response.json()
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: error.error || 'Login failed'
        }))
        return { success: false, error: error.error }
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: 'Network error'
      }))
      return { success: false, error: 'Network error' }
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setAuthState({
        user: null,
        loading: false,
        error: null
      })
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return {
    ...authState,
    login,
    logout
  }
}
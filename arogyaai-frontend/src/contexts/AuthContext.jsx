import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { authService, userService } from '@/services'
import { getErrorMessage } from '@/utils/errors'
import { markRefreshFailed, resetAuthClientState } from '@/api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const initializedRef = useRef(false)

  const fetchUser = useCallback(async () => {
    const data = await userService.getMe()
    setUser(data)
    return data
  }, [])

  const initialize = useCallback(async () => {
    if (initializedRef.current) return
    initializedRef.current = true

    setIsLoading(true)
    setError(null)

    const data = await userService.bootstrap()
    setUser(data)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    const onSessionExpired = () => setUser(null)
    window.addEventListener('auth:session-expired', onSessionExpired)
    return () => window.removeEventListener('auth:session-expired', onSessionExpired)
  }, [])

  const login = async (credentials) => {
    setError(null)
    try {
      resetAuthClientState()
      await authService.login(credentials)
      const data = await fetchUser()
      setUser(data)
      return data
    } catch (err) {
      markRefreshFailed()
      const message = getErrorMessage(err, 'Login failed')
      setError(message)
      throw new Error(message)
    }
  }

  const signup = async (payload) => {
    setError(null)
    try {
      resetAuthClientState()
      await authService.signup(payload)
      const data = await fetchUser()
      setUser(data)
      return data
    } catch (err) {
      markRefreshFailed()
      const message = getErrorMessage(err, 'Signup failed')
      setError(message)
      throw new Error(message)
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
    } finally {
      setUser(null)
      markRefreshFailed()
    }
  }

  const refreshUser = fetchUser

  const isAuthenticated = !!user
  const needsOnboarding = isAuthenticated && !user?.profile

  const value = useMemo(
    () => ({
      user,
      isLoading,
      error,
      isAuthenticated,
      needsOnboarding,
      login,
      signup,
      logout,
      refreshUser,
      clearError: () => setError(null),
    }),
    [user, isLoading, error, isAuthenticated, needsOnboarding, fetchUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider')
  }
  return context
}

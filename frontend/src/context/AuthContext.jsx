import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getCurrentUser, loginUser, loginWithSSO, logoutUser, registerUser } from '../services/api.js'

const AuthContext = createContext(null)
const STORAGE_KEY = 'talenthub-auth-user'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem(STORAGE_KEY)
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }

    getCurrentUser()
      .then((currentUser) => {
        setUser(currentUser)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser))
      })
      .catch(() => {
        setUser(null)
        localStorage.removeItem(STORAGE_KEY)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (credentials) => {
    const response = await loginUser(credentials)
    setUser(response.user)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(response.user))
    return response.user
  }

  const loginSSO = async (payload) => {
    const response = await loginWithSSO(payload)
    setUser(response.user)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(response.user))
    return response.user
  }

  const finishSSO = async () => {
    const currentUser = await getCurrentUser()
    setUser(currentUser)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser))
    return currentUser
  }

  const register = async (payload) => {
    const response = await registerUser(payload)
    setUser(response.user)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(response.user))
    return response.user
  }

  const syncUser = (nextUser) => {
    setUser(nextUser)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser))
  }

  const logout = async () => {
    await logoutUser().catch(() => {})
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      loginSSO,
      finishSSO,
      register,
      logout,
      syncUser,
    }),
    [loading, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}

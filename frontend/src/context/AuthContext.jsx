import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import authService   from '../services/authService'
import groupsService from '../services/groupsService'
import { tokenStorage, userStorage } from '../services/api'

const GROUP_KEY = 'wams_active_group'
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [group,   setGroup]   = useState(() => {
    try { return JSON.parse(localStorage.getItem(GROUP_KEY)) } catch { return null }
  })
  // Start as false — we set user from localStorage synchronously below,
  // so the app never needs to show a loading screen on first paint.
  const [loading, setLoading] = useState(false)

  // ── Synchronous init from localStorage (runs before first render) ──────────
  // This means PrivateRoute never sees user=null on a valid session.
  useState(() => {
    const token  = tokenStorage.get()
    const cached = userStorage.get()
    if (token && cached) {
      setUser(cached)
    }
  })

  // ── Background verification (does NOT block rendering) ───────────────────
  useEffect(() => {
    const token = tokenStorage.get()
    if (!token) return   // not logged in, nothing to verify

    // Silently verify token in the background.
    // We already showed the page from cache; if token is invalid
    // we log out quietly. We do NOT set loading=true here because
    // the user is already in the app.
    authService.getMe()
      .then(fresh => {
        setUser(fresh)
        userStorage.set(fresh)
      })
      .catch(err => {
        // Only logout on explicit 401/403 — ignore network errors
        const status = err?.response?.status
        if (status === 401 || status === 403) {
          tokenStorage.remove()
          userStorage.remove()
          localStorage.removeItem(GROUP_KEY)
          setUser(null)
          setGroup(null)
        }
        // Network error or service down → keep user logged in
      })
  }, [])

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const { token, user: u } = await authService.login(email, password)
    tokenStorage.set(token)
    userStorage.set(u)
    setUser(u)
    const saved = JSON.parse(localStorage.getItem(GROUP_KEY) || 'null')
    if (saved) setGroup(saved)
    return u
  }, [])

  // ── Signup ────────────────────────────────────────────────────────────────
  const signup = useCallback(async (name, email, password) => {
    const { token, user: u } = await authService.register(name, email, password)
    tokenStorage.set(token)
    userStorage.set(u)
    setUser(u)
    setGroup(null)
    localStorage.removeItem(GROUP_KEY)
    return u
  }, [])

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    tokenStorage.remove()
    userStorage.remove()
    localStorage.removeItem(GROUP_KEY)
    setUser(null)
    setGroup(null)
  }, [])

  const updateProfile = useCallback(async (payload) => {
    const { user: updated } = await authService.updateMe(payload)
    setUser(updated)
    userStorage.set(updated)
    return updated
  }, [])

  const setActiveGroup = useCallback((grp) => {
    setGroup(grp)
    if (grp) localStorage.setItem(GROUP_KEY, JSON.stringify(grp))
    else     localStorage.removeItem(GROUP_KEY)
  }, [])

  const refreshGroups = useCallback(async () => {
    try { return await groupsService.getMyGroups() }
    catch { return [] }
  }, [])

  return (
    <AuthContext.Provider value={{
      user, group, loading,
      login, signup, logout, updateProfile,
      setActiveGroup,
      updateGroup: setActiveGroup,
      refreshGroups,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }

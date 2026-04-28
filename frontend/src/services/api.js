import axios from 'axios'

// ── Token & user storage ──────────────────────────────────────────────────────
const TOKEN_KEY = 'wams_token'
const USER_KEY  = 'wams_user'

export const tokenStorage = {
  get:    ()      => localStorage.getItem(TOKEN_KEY),
  set:    (token) => localStorage.setItem(TOKEN_KEY, token),
  remove: ()      => localStorage.removeItem(TOKEN_KEY),
}

export const userStorage = {
  get:    ()     => { try { return JSON.parse(localStorage.getItem(USER_KEY)) } catch { return null } },
  set:    (user) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  remove: ()     => localStorage.removeItem(USER_KEY),
}

// ── Service base URLs (empty = same origin, Vite proxy handles routing) ────────
export const SERVICES = {
  auth:   import.meta.env.VITE_AUTH_URL   || '',
  lists:  import.meta.env.VITE_LISTS_URL  || '',
  meals:  import.meta.env.VITE_MEALS_URL  || '',
  users:  import.meta.env.VITE_USERS_URL  || '',
  groups: import.meta.env.VITE_GROUPS_URL || '',
}

// ── Axios instance ────────────────────────────────────────────────────────────
const api = axios.create({ timeout: 15000 })

// Attach JWT on every request
api.interceptors.request.use(config => {
  const token = tokenStorage.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// IMPORTANT: The response interceptor must NOT auto-redirect on 401.
// Doing so causes a logout loop: after login, Dashboard mounts and fires
// several API calls; if any of them returns 401 (race condition, service
// not yet ready, etc.) the interceptor would clear the token and redirect
// before the user even sees the page.
//
// Instead we simply reject the error and let each caller handle it.
// AuthContext.restore() is the only place that decides to logout on 401.
api.interceptors.response.use(
  response => response,
  error => Promise.reject(error)
)

export default api

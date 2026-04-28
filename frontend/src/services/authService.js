/**
 * src/services/authService.js
 * ---------------------------
 * All HTTP calls that talk to the auth-service (port 5001).
 * Used by AuthContext – no component should call these directly.
 */

import api, { SERVICES } from './api'

const BASE = `${SERVICES.auth}/api/auth`

const authService = {

  /**
   * POST /api/auth/login
   * Returns { token, user }
   */
  login: async (email, password) => {
    const { data } = await api.post(`${BASE}/login`, { email, password })
    return data   // { message, token, user: { id, name, email, role, ... } }
  },

  /**
   * POST /api/auth/register
   * Returns { token, user }
   */
  register: async (name, email, password) => {
    const { data } = await api.post(`${BASE}/register`, { name, email, password })
    return data
  },

  /**
   * GET /api/auth/me  (requires token in header – handled by interceptor)
   * Returns the current user object
   */
  getMe: async () => {
    const { data } = await api.get(`${BASE}/me`)
    return data
  },

  /**
   * PUT /api/auth/me
   * Update name or password
   */
  updateMe: async (payload) => {
    const { data } = await api.put(`${BASE}/me`, payload)
    return data
  },

  // ── Admin ──────────────────────────────────────────────────────────────────

  /** GET /api/auth/admin/users  – returns array of all users */
  adminListUsers: async () => {
    const { data } = await api.get(`${BASE}/admin/users`)
    return data
  },

  /** PUT /api/auth/admin/users/:id  – update role or is_active */
  adminUpdateUser: async (userId, payload) => {
    const { data } = await api.put(`${BASE}/admin/users/${userId}`, payload)
    return data
  },

  /** DELETE /api/auth/admin/users/:id  – soft-deactivate */
  adminDeleteUser: async (userId) => {
    const { data } = await api.delete(`${BASE}/admin/users/${userId}`)
    return data
  },
}

export default authService

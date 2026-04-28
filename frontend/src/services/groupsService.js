/**
 * src/services/groupsService.js
 * HTTP calls to the groups-service (port 5005).
 */
import api, { SERVICES } from './api'

const BASE = `${SERVICES.groups || 'http://localhost:5005'}/api/groups`

const groupsService = {
  /** GET /api/groups/mine — all groups the current user belongs to */
  getMyGroups: async () => {
    const { data } = await api.get(`${BASE}/mine`)
    return data
  },

  /** GET /api/groups/by-code/:code — preview before joining */
  getGroupByCode: async (code) => {
    const { data } = await api.get(`${BASE}/by-code/${code}`)
    return data
  },

  /** GET /api/groups/:id — full detail including members */
  getGroup: async (groupId) => {
    const { data } = await api.get(`${BASE}/${groupId}`)
    return data
  },

  /** POST /api/groups — create { name } */
  createGroup: async (name) => {
    const { data } = await api.post(BASE, { name })
    return data  // { id, name, code, owner_id, members }
  },

  /** POST /api/groups/join — join by { code } */
  joinGroup: async (code) => {
    const { data } = await api.post(`${BASE}/join`, { code })
    return data
  },

  /** DELETE /api/groups/:id/leave */
  leaveGroup: async (groupId) => {
    const { data } = await api.delete(`${BASE}/${groupId}/leave`)
    return data
  },

  /** DELETE /api/groups/:id — owner only */
  deleteGroup: async (groupId) => {
    const { data } = await api.delete(`${BASE}/${groupId}`)
    return data
  },

  /** GET /api/groups/:id/members */
  getMembers: async (groupId) => {
    const { data } = await api.get(`${BASE}/${groupId}/members`)
    return data
  },
}

export default groupsService

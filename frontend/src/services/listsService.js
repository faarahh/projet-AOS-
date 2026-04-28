import api, { SERVICES } from './api'

const BASE = `${SERVICES.lists}/api/lists`

const listsService = {
  getLists: async (groupId) => {
    const url = groupId ? `${BASE}?group_id=${groupId}` : BASE
    const { data } = await api.get(url)
    return data
  },

  getList: async (listId, groupId) => {
    const url = groupId ? `${BASE}/${listId}?group_id=${groupId}` : `${BASE}/${listId}`
    const { data } = await api.get(url)
    return data
  },

  createList: async (title, groupId) => {
    const { data } = await api.post(BASE, { title, group_id: groupId || null })
    return data
  },

  updateList: async (listId, title) => {
    const { data } = await api.put(`${BASE}/${listId}`, { title })
    return data
  },

  deleteList: async (listId) => {
    const { data } = await api.delete(`${BASE}/${listId}`)
    return data
  },

  addItem: async (listId, { name, quantity = 1, unit = 'unit' }, groupId) => {
    const { data } = await api.post(`${BASE}/${listId}/items`,
      { name, quantity, unit, group_id: groupId || null })
    return data
  },

  updateItem: async (listId, itemId, payload, groupId) => {
    const { data } = await api.put(`${BASE}/${listId}/items/${itemId}`,
      { ...payload, group_id: groupId || null })
    return data
  },

  deleteItem: async (listId, itemId, groupId) => {
    const { data } = await api.delete(`${BASE}/${listId}/items/${itemId}`)
    return data
  },

  // Notifications
  getNotifications: async (groupId) => {
    if (!groupId) return []
    const { data } = await api.get(`${BASE}/notifications?group_id=${groupId}`)
    return data
  },

  markRead: async (notifId) => {
    const { data } = await api.put(`${BASE}/notifications/${notifId}/read`)
    return data
  },

  markAllRead: async (groupId) => {
    const { data } = await api.put(`${BASE}/notifications/read-all?group_id=${groupId}`)
    return data
  },
}

export default listsService

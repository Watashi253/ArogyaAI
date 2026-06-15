import apiClient, { bootstrapSession } from '../api/client'
import { ENDPOINTS } from '../api/endpoints'

function sanitizeUser(user) {
  if (!user) return null
  const { passwordHash, ...safe } = user
  return safe
}

export const userService = {
  getMe: async () => {
    const { data } = await apiClient.get(ENDPOINTS.users.me)
    return sanitizeUser(data)
  },

  bootstrap: async () => {
    const data = await bootstrapSession()
    return sanitizeUser(data)
  },

  updateProfile: (profile) =>
    apiClient.put(ENDPOINTS.users.profile, profile),
}

import apiClient, { bootstrapSession, markRefreshFailed, resetAuthClientState } from '../api/client'
import { ENDPOINTS } from '../api/endpoints'

export const authService = {
  signup: async (data) => {
    const response = await apiClient.post(ENDPOINTS.auth.signup, data, { skipAuthRefresh: true })
    resetAuthClientState()
    return response
  },

  login: async (data) => {
    const response = await apiClient.post(ENDPOINTS.auth.login, data, { skipAuthRefresh: true })
    resetAuthClientState()
    return response
  },

  logout: async () => {
    try {
      await apiClient.post(ENDPOINTS.auth.logout, null, { skipAuthRefresh: true })
    } finally {
      markRefreshFailed()
    }
  },

  refresh: () => apiClient.post(ENDPOINTS.auth.refresh, null, { skipAuthRefresh: true }),

  forgotPassword: (email) =>
    apiClient.post(ENDPOINTS.auth.forgotPassword, { email }, { skipAuthRefresh: true }),

  resetPassword: (token, password) =>
    apiClient.post(ENDPOINTS.auth.resetPassword, { token, password }, { skipAuthRefresh: true }),

  bootstrapSession,
}

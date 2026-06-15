import apiClient from '../api/client'
import { ENDPOINTS } from '../api/endpoints'

export const activityService = {
  getTypes: () => apiClient.get(ENDPOINTS.activity.types),
  log: (data) => apiClient.post(ENDPOINTS.activity.log, data),
  getLogs: (date) => apiClient.get(ENDPOINTS.activity.logs, { params: { date } }),
  getWeek: () => apiClient.get(ENDPOINTS.activity.week),
  getMonth: () => apiClient.get(ENDPOINTS.activity.month),
  getStats: () => apiClient.get(ENDPOINTS.activity.stats),
  update: (id, data) => apiClient.put(ENDPOINTS.activity.byId(id), data),
  remove: (id) => apiClient.delete(ENDPOINTS.activity.byId(id)),
}

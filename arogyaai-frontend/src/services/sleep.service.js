import apiClient from '../api/client'
import { ENDPOINTS } from '../api/endpoints'

export const sleepService = {
  log: (data) => apiClient.post(ENDPOINTS.sleep.log, data),
  getLogs: (date) => apiClient.get(ENDPOINTS.sleep.logs, { params: { date } }),
  getWeek: () => apiClient.get(ENDPOINTS.sleep.week),
  getMonth: () => apiClient.get(ENDPOINTS.sleep.month),
  update: (id, data) => apiClient.put(ENDPOINTS.sleep.byId(id), data),
  remove: (id) => apiClient.delete(ENDPOINTS.sleep.byId(id)),
}

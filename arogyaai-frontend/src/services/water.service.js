import apiClient from '../api/client'
import { ENDPOINTS } from '../api/endpoints'

export const waterService = {
  log: (data) => apiClient.post(ENDPOINTS.water.log, data),
  getLogs: (date) => apiClient.get(ENDPOINTS.water.logs, { params: { date } }),
  getDaily: () => apiClient.get(ENDPOINTS.water.daily),
  getWeek: () => apiClient.get(ENDPOINTS.water.week),
  getMonth: () => apiClient.get(ENDPOINTS.water.month),
  update: (id, data) => apiClient.put(ENDPOINTS.water.byId(id), data),
  remove: (id) => apiClient.delete(ENDPOINTS.water.byId(id)),
}

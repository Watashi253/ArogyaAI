import apiClient from '../api/client'
import { ENDPOINTS } from '../api/endpoints'

export const medicineService = {
  list: () => apiClient.get(ENDPOINTS.medicines.list),
  today: () => apiClient.get(ENDPOINTS.medicines.today),
  history: (days = 30) => apiClient.get(ENDPOINTS.medicines.history, { params: { days } }),
  create: (data) => apiClient.post(ENDPOINTS.medicines.create, data),
  take: (id) => apiClient.post(ENDPOINTS.medicines.take(id)),
  update: (id, data) => apiClient.put(ENDPOINTS.medicines.byId(id), data),
  remove: (id) => apiClient.delete(ENDPOINTS.medicines.byId(id)),
}

import apiClient from '../api/client'
import { ENDPOINTS } from '../api/endpoints'

export const nutritionService = {
  logMeal: (data) => apiClient.post(ENDPOINTS.nutrition.log, data),
  getLogs: (date) => apiClient.get(ENDPOINTS.nutrition.logs, { params: { date } }),
  getWeek: () => apiClient.get(ENDPOINTS.nutrition.week),
  getMonth: () => apiClient.get(ENDPOINTS.nutrition.month),
}

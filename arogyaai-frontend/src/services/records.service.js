import apiClient, { uploadFormData } from '../api/client'
import { ENDPOINTS } from '../api/endpoints'

export const recordsService = {
  list: () => apiClient.get(ENDPOINTS.records.list),
  getById: (id) => apiClient.get(ENDPOINTS.records.byId(id)),
  upload: (formData) => uploadFormData(ENDPOINTS.records.upload, formData),
  getLabTrend: (parameter) => apiClient.get(ENDPOINTS.records.labTrend(parameter)),
  remove: (id) => apiClient.delete(ENDPOINTS.records.byId(id)),
}

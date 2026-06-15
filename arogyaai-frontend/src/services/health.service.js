import apiClient, { downloadPdf, uploadFormData } from '../api/client'
import { ENDPOINTS } from '../api/endpoints'

export const healthService = {
  scanMeal: (formData) => uploadFormData(ENDPOINTS.health.scanMeal, formData),
  getInsights: () => apiClient.get(ENDPOINTS.health.insights),
  getDoctorSummary: () => apiClient.get(ENDPOINTS.health.doctorSummary),
  getWeeklyReport: () => apiClient.get(ENDPOINTS.health.weeklyReport),
  getMealHistory: () => apiClient.get(ENDPOINTS.health.mealHistory),
  getComprehensiveReport: () => apiClient.get(ENDPOINTS.health.comprehensiveReport),
  getProfile: () => apiClient.get(ENDPOINTS.health.profile),

  downloadDoctorSummaryPdf: () =>
    downloadPdf(ENDPOINTS.health.doctorSummaryPdf, 'doctor-summary.pdf'),
  downloadWeeklyReportPdf: () =>
    downloadPdf(ENDPOINTS.health.weeklyReportPdf, 'weekly-report.pdf'),
  downloadMealHistoryPdf: () =>
    downloadPdf(ENDPOINTS.health.mealHistoryPdf, 'meal-history.pdf'),
  downloadComprehensiveReportPdf: () =>
    downloadPdf(ENDPOINTS.health.comprehensiveReportPdf, 'comprehensive-report.pdf'),
}

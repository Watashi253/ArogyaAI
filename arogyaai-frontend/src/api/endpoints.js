export const API_BASE_URL = import.meta.env.VITE_API_URL || ''

export const ENDPOINTS = {
  health: '/health',

  auth: {
    signup: '/api/auth/signup',
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    refresh: '/api/auth/refresh',
    forgotPassword: '/api/auth/forgot-password',
    resetPassword: '/api/auth/reset-password',
  },

  users: {
    me: '/api/users/me',
    profile: '/api/users/profile',
  },

  nutrition: {
    log: '/api/nutrition/log',
    logs: '/api/nutrition/logs',
    week: '/api/nutrition/logs/week',
    month: '/api/nutrition/logs/month',
  },

  sleep: {
    log: '/api/sleep/log',
    logs: '/api/sleep/logs',
    week: '/api/sleep/logs/week',
    month: '/api/sleep/logs/month',
    byId: (id) => `/api/sleep/${id}`,
  },

  water: {
    log: '/api/water/log',
    logs: '/api/water/logs',
    daily: '/api/water/logs/daily',
    week: '/api/water/logs/week',
    month: '/api/water/logs/month',
    byId: (id) => `/api/water/${id}`,
  },

  activity: {
    types: '/api/activity/types',
    log: '/api/activity/log',
    logs: '/api/activity/logs',
    week: '/api/activity/logs/week',
    month: '/api/activity/logs/month',
    stats: '/api/activity/stats',
    byId: (id) => `/api/activity/${id}`,
  },

  medicines: {
    list: '/api/medicines',
    today: '/api/medicines/today',
    history: '/api/medicines/history',
    create: '/api/medicines',
    take: (id) => `/api/medicines/${id}/take`,
    byId: (id) => `/api/medicines/${id}`,
  },

  records: {
    list: '/api/records',
    upload: '/api/records/upload',
    byId: (id) => `/api/records/${id}`,
    labTrend: (parameter) => `/api/records/labs/trend/${encodeURIComponent(parameter)}`,
  },

  health: {
    scanMeal: '/api/health/scan-meal',
    insights: '/api/health/insights',
    doctorSummary: '/api/health/doctor-summary',
    doctorSummaryPdf: '/api/health/doctor-summary/pdf',
    weeklyReport: '/api/health/weekly-report',
    weeklyReportPdf: '/api/health/weekly-report/pdf',
    mealHistory: '/api/health/meal-history',
    mealHistoryPdf: '/api/health/meal-history/pdf',
    comprehensiveReport: '/api/health/comprehensive-report',
    comprehensiveReportPdf: '/api/health/comprehensive-report/pdf',
    profile: '/api/health/profile',
  },
}

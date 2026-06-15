import axios from 'axios'
import { API_BASE_URL, ENDPOINTS } from './endpoints'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

let isRefreshing = false
let refreshFailed = false
let failedQueue = []

const AUTH_SKIP_PATHS = [
  ENDPOINTS.auth.login,
  ENDPOINTS.auth.signup,
  ENDPOINTS.auth.refresh,
  ENDPOINTS.auth.logout,
  ENDPOINTS.auth.forgotPassword,
  ENDPOINTS.auth.resetPassword,
]

function matchesPath(url, path) {
  if (!url) return false
  return url === path || url.endsWith(path)
}

function shouldSkipRefresh(url, config) {
  if (config?.skipAuthRefresh) return true
  return AUTH_SKIP_PATHS.some((path) => matchesPath(url, path))
}

export function resetAuthClientState() {
  refreshFailed = false
  isRefreshing = false
  failedQueue = []
}

export function markRefreshFailed() {
  refreshFailed = true
  isRefreshing = false
  failedQueue = []
  window.dispatchEvent(new CustomEvent('auth:session-expired'))
}

function processQueue(error, tokenRefreshed = false) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(tokenRefreshed)
  })
  failedQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      shouldSkipRefresh(originalRequest.url, originalRequest) ||
      refreshFailed
    ) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then(() => apiClient(originalRequest))
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      await apiClient.post(ENDPOINTS.auth.refresh, null, { skipAuthRefresh: true })
      refreshFailed = false
      processQueue(null, true)
      return apiClient(originalRequest)
    } catch (refreshError) {
      markRefreshFailed()
      processQueue(refreshError, false)
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default apiClient

export async function downloadPdf(endpoint, filename) {
  const response = await apiClient.get(endpoint, { responseType: 'blob' })
  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export async function uploadFormData(endpoint, formData) {
  return apiClient.post(endpoint, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export async function bootstrapSession() {
  try {
    const { data } = await apiClient.get(ENDPOINTS.users.me, { skipAuthRefresh: true })
    resetAuthClientState()
    return data
  } catch (error) {
    if (error.response?.status !== 401) {
      return null
    }

    try {
      await apiClient.post(ENDPOINTS.auth.refresh, null, { skipAuthRefresh: true })
      const { data } = await apiClient.get(ENDPOINTS.users.me, { skipAuthRefresh: true })
      resetAuthClientState()
      return data
    } catch {
      markRefreshFailed()
      return null
    }
  }
}

import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api/v1'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Interceptor: Auto-attach Bearer Token from localStorage
api.interceptors.request.use(
  (config) => {
    try {
      const savedAuth = localStorage.getItem('hirely_auth')
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth)
        if (parsed?.access_token) {
          config.headers.Authorization = `Bearer ${parsed.access_token}`
        }
      }
    } catch (err) {
      console.error('Failed to parse auth token from localStorage', err)
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor: Catch 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('401 Unauthorized detected. Clearing session.')
      localStorage.removeItem('hirely_auth')
      if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

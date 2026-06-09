import axios from 'axios'

// ── In-memory access token (never persisted to localStorage) ──────────────────
let accessToken = null
let csrfToken = null

export function setAccessToken(token) { accessToken = token }
export function getAccessToken() { return accessToken }

// ── CSRF helpers ──────────────────────────────────────────────────────────────
async function fetchCsrfToken() {
  const res = await axios.get('/api/csrf-token', { withCredentials: true })
  csrfToken = res.data.csrfToken
  return csrfToken
}

async function getCsrfToken() {
  if (csrfToken) return csrfToken
  return fetchCsrfToken()
}

// ── Refresh helper (raw axios, no interceptors) ───────────────────────────────
async function callRefresh(refreshToken) {
  if (!csrfToken) await fetchCsrfToken()
  return axios.post(
    '/api/auth/refresh',
    { refreshToken },
    {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
    }
  )
}

// ── Page-load session restore ─────────────────────────────────────────────────
// Called by AuthContext on mount. If a refreshToken is in localStorage, silently
// exchanges it for a new access token so the first API call doesn't get a 401.
export async function initializeAuth() {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) return null
  try {
    const res = await callRefresh(refreshToken)
    accessToken = res.data.accessToken
    localStorage.setItem('refreshToken', res.data.refreshToken)
    return res.data
  } catch {
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    return null
  }
}

// ── Axios instance ────────────────────────────────────────────────────────────
const client = axios.create({ baseURL: '/api', withCredentials: true })

// ── Request interceptor ───────────────────────────────────────────────────────
client.interceptors.request.use(async (config) => {
  // Only set Authorization if not already pre-set by the caller (e.g. logout)
  if (accessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  if (['post', 'put', 'delete', 'patch'].includes(config.method)) {
    const csrf = await getCsrfToken()
    config.headers['X-CSRF-Token'] = csrf
  }
  return config
})

// ── Response interceptor: auto-refresh on 401 ────────────────────────────────
let isRefreshing = false
let failedQueue = []

function processQueue(error, token = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    error ? reject(error) : resolve(token)
  })
  failedQueue = []
}

client.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config

    if (err.response?.status === 403 && err.response?.data?.message?.includes('CSRF')) {
      csrfToken = null
    }

    if (err.response?.status === 401 && !original._retry) {
      original._retry = true

      const storedRefreshToken = localStorage.getItem('refreshToken')
      if (!storedRefreshToken) {
        accessToken = null
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(err)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return client(original)
        })
      }

      isRefreshing = true

      try {
        const res = await callRefresh(storedRefreshToken)
        const newToken = res.data.accessToken
        accessToken = newToken
        localStorage.setItem('refreshToken', res.data.refreshToken)
        processQueue(null, newToken)
        original.headers.Authorization = `Bearer ${newToken}`
        return client(original)
      } catch (refreshErr) {
        processQueue(refreshErr, null)
        accessToken = null
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(err)
  }
)

export default client

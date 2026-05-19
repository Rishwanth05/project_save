import axios from 'axios'

const client = axios.create({ baseURL: '/api', withCredentials: true })

// SEC4 — fetch CSRF token once and attach to all requests
let csrfToken = null

async function getCsrfToken() {
  if (csrfToken) return csrfToken
  const res = await axios.get('/api/csrf-token', { withCredentials: true })
  csrfToken = res.data.csrfToken
  return csrfToken
}

client.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`

  // SEC4 — attach CSRF token to all state-changing requests
  if (['post', 'put', 'delete', 'patch'].includes(config.method)) {
    const csrf = await getCsrfToken()
    config.headers['X-CSRF-Token'] = csrf
  }

  return config
})

client.interceptors.response.use(
  (res) => res,
  (err) => {
    // SEC4 — if CSRF token rejected, clear it so next request fetches a fresh one
    if (err.response?.status === 403 && err.response?.data?.message?.includes('CSRF')) {
      csrfToken = null
    }
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default client
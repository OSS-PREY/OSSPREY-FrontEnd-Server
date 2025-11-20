const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

export const getApiBaseUrl = () => {
  if (!apiBaseUrl)
    console.warn('VITE_API_BASE_URL is not set. API requests may fail.');

  return apiBaseUrl
}

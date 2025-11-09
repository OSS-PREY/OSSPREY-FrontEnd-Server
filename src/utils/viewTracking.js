const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://ossprey.ngrok.app').replace(/\/$/, '')

export const VIEW_RECORDED_EVENT = 'ossprey-view-recorded'

export const recordView = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/record_view`, {
      method: 'POST',
    })

    if (!response.ok) {
      console.error(`Failed to record view: ${response.status} ${response.statusText}`)
      return false
    }

    window.dispatchEvent(new CustomEvent(VIEW_RECORDED_EVENT))
    return true
  }
  catch (error) {
    console.error('Failed to record view:', error)
    return false
  }
}

export const fetchViewCount = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/view_count`)

    if (!response.ok) {
      console.error(`Failed to fetch view count: ${response.status} ${response.statusText}`)
      return null
    }

    const data = await response.json().catch(() => null)

    if (typeof data === 'number')
      return data

    if (data && typeof data.count === 'number')
      return data.count

    if (data && typeof data.view_count === 'number')
      return data.view_count

    return null
  }
  catch (error) {
    console.error('Failed to fetch view count:', error)
    return null
  }
}

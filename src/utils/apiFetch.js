/**
 * fetch() for our own API.
 *
 * The API is exposed through a free ngrok tunnel, which answers browser-looking
 * requests with an HTML interstitial (ERR_NGROK_6024) instead of proxying them.
 * That page carries no CORS headers, so the browser blocks it and the call fails
 * as "Failed to fetch". The header below opts out of the interstitial.
 *
 * Once the API moves off free ngrok, drop the header and this stays a plain
 * fetch wrapper -- no call site has to change.
 */
export const apiFetch = (url, options = {}) => fetch(url, {
  ...options,
  headers: {
    ...(options.headers || {}),
    'ngrok-skip-browser-warning': 'true',
  },
})

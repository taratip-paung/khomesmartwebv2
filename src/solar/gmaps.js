/**
 * Google Maps JS loader (browser key only — referrer-restricted to beconnectedcm.com + localhost:5173).
 * Loaded lazily the first time a map is shown, so the rest of /solar never pays for it.
 */
export const GMAPS_KEY = import.meta.env.VITE_GMAPS_BROWSER_KEY || ''

let promise = null
export function loadGoogleMaps(lang = 'en') {
  if (!GMAPS_KEY) return Promise.reject(new Error('no_browser_key'))
  if (window.google?.maps?.importLibrary) return Promise.resolve(window.google.maps)
  if (promise) return promise
  promise = new Promise((resolve, reject) => {
    const cb = '__bcGmapsReady'
    window[cb] = () => resolve(window.google.maps)
    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GMAPS_KEY)}&v=weekly&loading=async&libraries=places,geometry&language=${lang}&region=TH&callback=${cb}`
    s.async = true
    s.onerror = () => {
      promise = null
      reject(new Error('load_failed'))
    }
    document.head.appendChild(s)
  })
  return promise
}

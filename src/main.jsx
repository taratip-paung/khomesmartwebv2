import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/global.css'

// /solar → Solar Builder (separate lazy chunk: the home page bundle does not grow)
const SolarApp = lazy(() => import('./solar/SolarApp'))
const isSolar = /^\/solar(\/|$)/.test(window.location.pathname)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isSolar ? (
      <Suspense fallback={null}>
        <SolarApp />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
)

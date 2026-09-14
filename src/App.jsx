import { lazy, Suspense, useEffect, useMemo } from 'react'
import { AppProvider, useApp } from './AppContext'
import { LangProvider } from './i18n/LangContext'
import { ThemeProvider } from './ThemeContext'
import Header from './components/Header'
import HeroContent from './components/HeroContent'
import ServicePanel, { MobileServices } from './components/ServicePanel'
import InteractionHelp, { ScrollCue } from './components/InteractionHelp'
import LoadingScreen from './components/LoadingScreen'
import Sections from './components/Sections'
import { SceneErrorBoundary, StaticFallback, supportsWebGL } from './three/Fallback'

// three.js + R3F are code-split so the shell paints before the 3D bundle arrives
const Scene = lazy(() => import('./three/Scene'))

/** Mirrors sceneReady onto <html data-ready> so header/UI fade-in CSS can key off it */
function ReadyFlag() {
  const { sceneReady } = useApp()
  useEffect(() => {
    document.documentElement.dataset.ready = sceneReady
  }, [sceneReady])
  return null
}

function Hero() {
  const { sceneReady, setSceneReady } = useApp()
  const webgl = useMemo(supportsWebGL, [])

  // no WebGL → nothing to wait for
  useEffect(() => {
    if (!webgl) setSceneReady(true)
  }, [webgl, setSceneReady])

  return (
    <section id="home" className="hero" data-ready={sceneReady}>
      <div className="hero__canvas">
        {webgl ? (
          <SceneErrorBoundary onFail={() => setSceneReady(true)}>
            <Suspense fallback={null}>
              <Scene />
            </Suspense>
          </SceneErrorBoundary>
        ) : (
          <StaticFallback />
        )}
        {webgl && <InteractionHelp />}
      </div>

      <div className="hero__ui">
        <HeroContent />
        <div aria-hidden="true" />
        <ServicePanel />
      </div>

      <MobileServices />
      <ScrollCue />
    </section>
  )
}

export default function App() {
  return (
    <ThemeProvider>
    <LangProvider>
      <AppProvider>
        <ReadyFlag />
        <LoadingScreen />
        <Header />
        <main>
          <Hero />
          <Sections />
        </main>
      </AppProvider>
    </LangProvider>
    </ThemeProvider>
  )
}

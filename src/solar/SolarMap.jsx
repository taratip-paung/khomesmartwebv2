import { useEffect, useRef, useState } from 'react'
import { loadGoogleMaps, GMAPS_KEY } from './gmaps'
import { selectedSegment } from '../lib/solar/insights'
import { houseFootprint, houseSize } from '../lib/solar/geo'

const CM = { lat: 18.7883, lng: 98.9853 } // Chiang Mai

/**
 * Satellite map: search an address, tap / drag the pin on the roof.
 * Overlays: roof faces from Google Solar API (chosen one highlighted) and — once the user is orienting —
 * a top-down house footprint turned to their azimuth (outline, panel area, ridge/hips, facing arrow).
 * S3.1b: top-down on purpose — Google dropped tilt/45° on satellite + hybrid maps (Maps JS 3.65, May 2026),
 * so a WebGLOverlayView house cannot be seen in perspective over satellite imagery. The 3D view lives in SolarScene.
 */
export default function SolarMap({ lat, lng, azimuth, roof = 'flat', insights, seg, onSegment, onPick, onError, lang, S, showSearch = true, mode = 'full', insetLabel, insetEdit, onInsetClick }) {
  const box = useRef()
  const searchBox = useRef()
  const g = useRef({})
  const [err, setErr] = useState(null)
  const [ready, setReady] = useState(false)
  const [pacReady, setPacReady] = useState(false)
  const onPickRef = useRef(onPick)
  onPickRef.current = onPick
  const onSegRef = useRef(onSegment)
  const modeRef = useRef(mode)
  modeRef.current = mode
  onSegRef.current = onSegment

  // init once
  useEffect(() => {
    let dead = false
    loadGoogleMaps(lang)
      .then(async (maps) => {
        if (dead) return
        await Promise.all([maps.importLibrary('maps'), maps.importLibrary('geometry'), maps.importLibrary('places')])
        const has = lat != null && lng != null
        const map = new maps.Map(box.current, {
          center: has ? { lat, lng } : CM,
          zoom: has ? 20 : 13,
          mapTypeId: 'hybrid',
          tilt: 0,
          heading: 0,
          gestureHandling: 'cooperative', // mobile: one finger scrolls the page (site rule), two fingers move the map
          mapTypeControl: false,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: true,
          clickableIcons: false,
        })
        const marker = new maps.Marker({ map, position: has ? { lat, lng } : null, draggable: true })
        const pick = (p) => onPickRef.current(+p.lat().toFixed(6), +p.lng().toFixed(6))
        map.addListener('click', (e) => modeRef.current !== 'inset' && pick(e.latLng))
        marker.addListener('dragend', (e) => pick(e.latLng))
        g.current = { maps, map, marker, overlays: [] }
        setReady(true)

        if (searchBox.current && maps.places?.PlaceAutocompleteElement) {
          const pac = new maps.places.PlaceAutocompleteElement({ includedRegionCodes: ['th'] })
          pac.className = 'sb-pac'
          // example text inside the box (property on current Maps JS, attribute as a fallback)
          pac.placeholder = S.map.placeholder
          pac.setAttribute('placeholder', S.map.placeholder)
          searchBox.current.replaceChildren(pac)
          g.current.pac = pac
          setPacReady(true)
          const onPlace = async (place) => {
            await place.fetchFields({ fields: ['location', 'viewport'] })
            if (!place.location) return
            map.setCenter(place.location)
            map.setZoom(20)
            pick(place.location)
          }
          pac.addEventListener('gmp-select', (ev) => ev.placePrediction && onPlace(ev.placePrediction.toPlace()))
          pac.addEventListener('gmp-placeselect', (ev) => ev.place && onPlace(ev.place)) // older event name
        }
      })
      .catch((e) => {
        if (dead) return
        setErr(e.message)
        onError?.(e.message)
      })
    return () => {
      dead = true
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // language switch → example text follows
  useEffect(() => {
    const pac = g.current.pac
    if (!pac) return
    pac.placeholder = S.map.placeholder
    pac.setAttribute('placeholder', S.map.placeholder)
  }, [S.map.placeholder, pacReady])

  // full ↔ inset (step 3 shows this same map, small, over the 3D view — same instance, so no extra map load)
  useEffect(() => {
    const { map, marker } = g.current
    if (!map) return
    const inset = mode === 'inset'
    map.setOptions(
      inset
        ? { gestureHandling: 'none', disableDefaultUI: true, fullscreenControl: false, zoomControl: false, keyboardShortcuts: false, clickableIcons: false }
        : { gestureHandling: 'cooperative', disableDefaultUI: false, keyboardShortcuts: true, mapTypeControl: false, streetViewControl: false, rotateControl: false, fullscreenControl: true },
    )
    marker.setVisible(!inset)
    const main = selectedSegment(insights, seg)
    const c = main?.center ?? (lat != null ? { lat, lng } : null)
    const t = window.setTimeout(() => {
      if (c) map.setCenter(c)
      if (inset) map.setZoom(20)
    }, 60) // after the container has resized
    return () => window.clearTimeout(t)
  }, [mode, ready]) // eslint-disable-line react-hooks/exhaustive-deps

  // pin moved from outside (GPS / typed coordinates)
  useEffect(() => {
    const { map, marker } = g.current
    if (!map || lat == null || lng == null) return
    const pos = { lat, lng }
    marker.setPosition(pos)
    if (!map.getBounds()?.contains(pos)) {
      map.setCenter(pos)
      map.setZoom(20)
    }
  }, [lat, lng])

  // overlays: roof faces + facing arrow
  useEffect(() => {
    const { maps, map } = g.current
    if (!map) return
    g.current.overlays.forEach((o) => o.setMap(null))
    const ov = []
    const main = selectedSegment(insights, seg)
    if (insights?.found) {
      for (const s of insights.segments) {
        if (!s.bbox) continue
        const isMain = main && s.i === main.i
        ov.push(
          new maps.Rectangle({
            map,
            bounds: { south: s.bbox.sw.lat, west: s.bbox.sw.lng, north: s.bbox.ne.lat, east: s.bbox.ne.lng },
            strokeColor: isMain ? '#ffc857' : '#35d6ff',
            strokeOpacity: isMain ? 1 : 0.7,
            strokeWeight: isMain ? 3 : 1.5,
            fillColor: isMain ? '#ffc857' : '#35d6ff',
            fillOpacity: isMain ? 0.18 : 0.06,
            clickable: !!onSegRef.current,
            zIndex: isMain ? 2 : 1,
          }),
        )
        const r = ov[ov.length - 1]
        r.addListener('click', () => onSegRef.current?.(s.i))
      }
    }
    const origin = main?.center ?? (lat != null ? { lat, lng } : null)
    if (origin && azimuth != null) {
      // top-down house turned to the user's facing, sized from the chosen roof face
      const { w, d } = houseSize({ roof, pitch: main?.pitch, areaM2: main?.areaM2 })
      const fp = houseFootprint({ center: origin, azimuth, roof, w, d })
      const line = (path, o) => ov.push(new maps.Polyline({ map, path, clickable: false, ...o }))
      ov.push(new maps.Polygon({ map, paths: fp.outline, strokeColor: '#ffffff', strokeOpacity: 0.95, strokeWeight: 2, fillColor: '#dfe6ef', fillOpacity: 0.04, clickable: false, zIndex: 3 }))
      // no panel zone on the map (owner 2026-09-25: it hid the roof photo) — area + count are shown in the side panel
      fp.ridges.forEach((p) => line(p, { strokeColor: '#ffffff', strokeOpacity: 0.9, strokeWeight: 1.5, zIndex: 5 }))
      ov.push(
        new maps.Polyline({
          map,
          path: [fp.arrowFrom, fp.arrowTo],
          strokeColor: '#ffc857',
          strokeWeight: 4,
          clickable: false,
          icons: [{ icon: { path: maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 4, fillColor: '#ffc857', fillOpacity: 1, strokeColor: '#1a1100' }, offset: '100%' }],
        }),
      )
    }
    g.current.overlays = ov
  }, [insights, seg, azimuth, roof, lat, lng, ready, onSegment ? 1 : 0])

  if (!GMAPS_KEY || err) return null // caller falls back to the compass view / coordinate inputs
  return (
    <div className={`sb-map${mode === 'inset' ? ' is-inset' : ''}`}>
      {/* always rendered (hidden when unused) so the search box survives going back to step 1 */}
      <div className="sb-map__search" hidden={!showSearch || mode === 'inset'}>
        <div className={`sb-search${pacReady ? ' is-ready' : ''}`}>
          {/* Google's element brings its own magnifier — ours only shows until it has loaded */}
          {!pacReady && (
            <svg className="sb-search__icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
          {/* Google's element is put in here once Maps has loaded; until then a look-alike box shows the example */}
          <div className="sb-search__slot" ref={searchBox} aria-label={S.map.search} />
          {!pacReady && <input className="sb-search__ph" placeholder={S.map.placeholder} disabled aria-hidden="true" tabIndex={-1} />}
        </div>
        <p className="sb-search__tip">{S.map.tip}</p>
      </div>
      <div className="sb-map__canvas" ref={box} />
      {mode === 'inset' ? (
        <div className="sb-map__inset-label">
          <span>{insetLabel}</span>
          <button type="button" className="btn btn--glass btn--sm" onClick={onInsetClick}>
            {insetEdit}
          </button>
        </div>
      ) : (
        <p className="sb-map__hint">{lat == null ? S.map.hintPick : S.map.hintDrag}</p>
      )}
    </div>
  )
}

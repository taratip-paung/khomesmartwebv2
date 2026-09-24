import { useEffect, useRef, useState } from 'react'
import { loadGoogleMaps, GMAPS_KEY } from './gmaps'
import { selectedSegment } from '../lib/solar/insights'

const CM = { lat: 18.7883, lng: 98.9853 } // Chiang Mai

/**
 * Satellite map: search an address, tap / drag the pin on the roof.
 * Overlays (from Google Solar API): roof faces (main one highlighted) + an arrow showing the panel
 * facing the user chose. The 3D house on the map (WebGLOverlayView) comes in plan task S3.1b.
 */
export default function SolarMap({ lat, lng, azimuth, insights, seg, onSegment, onPick, onError, lang, S, showSearch = true }) {
  const box = useRef()
  const searchBox = useRef()
  const g = useRef({})
  const [err, setErr] = useState(null)
  const onPickRef = useRef(onPick)
  onPickRef.current = onPick
  const onSegRef = useRef(onSegment)
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
        map.addListener('click', (e) => pick(e.latLng))
        marker.addListener('dragend', (e) => pick(e.latLng))
        g.current = { maps, map, marker, overlays: [] }

        if (showSearch && searchBox.current && maps.places?.PlaceAutocompleteElement) {
          const pac = new maps.places.PlaceAutocompleteElement({ includedRegionCodes: ['th'] })
          pac.className = 'sb-pac'
          searchBox.current.replaceChildren(pac)
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
      const from = new maps.LatLng(origin.lat, origin.lng)
      const to = maps.geometry.spherical.computeOffset(from, 7, azimuth)
      ov.push(
        new maps.Polyline({
          map,
          path: [from, to],
          strokeColor: '#ffc857',
          strokeWeight: 4,
          clickable: false,
          icons: [{ icon: { path: maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 4, fillColor: '#ffc857', fillOpacity: 1, strokeColor: '#1a1100' }, offset: '100%' }],
        }),
      )
    }
    g.current.overlays = ov
  }, [insights, seg, azimuth, lat, lng, onSegment ? 1 : 0])

  if (!GMAPS_KEY || err) return null // caller falls back to the compass view / coordinate inputs
  return (
    <div className="sb-map">
      {showSearch && <div className="sb-map__search" ref={searchBox} aria-label={S.map.search} />}
      <div className="sb-map__canvas" ref={box} />
      <p className="sb-map__hint">{lat == null ? S.map.hintPick : S.map.hintDrag}</p>
    </div>
  )
}

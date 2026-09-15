# KHOME SMART — 3D Futuristic Glass Website (prototype)

Interactive 3D homepage: React + Vite + Three.js (React Three Fiber / drei).
The 3D scene is a procedural PBR placeholder (real materials, shadows, environment
lighting, bloom) built from primitives; it is structured so a Blender GLB can replace
it later without rewriting the app.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # → dist/  (static, deploy behind nginx/HAProxy)
npm run preview
```

Node 20+ required. `react` is pinned to 19.2.x because `@react-three/fiber@9`
does not yet accept 19.3.

## Contact form → Telegram

`src/components/ContactForm.jsx` POSTs to `/api/contact`, served by `server/contact-server.mjs`
(zero-dependency Node service, binds 127.0.0.1:8787). It validates, rate-limits (5/IP/hour),
drops bots (honeypot + 3 s minimum fill time) and forwards the enquiry to a Telegram chat.

```bash
cp server/.env.example server/.env   # fill TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID
npm run contact                       # or: npm run contact:dry  (logs instead of sending)
npm run dev                           # Vite proxies /api → :8787
```

Production: `server/khome-contact.service` (systemd) + `server/nginx-snippet.conf`
(`location /api/` → 127.0.0.1:8787) on the same LXC that serves `dist/`.

## Where things live

| What | File |
|---|---|
| Service content (bilingual, icons, colours, marker anchors) | `src/data/services.js` |
| Camera states (position / target / duration) | `src/data/cameraTargets.js` |
| UI copy TH/EN | `src/i18n/strings.js` |
| Glass design tokens + all CSS | `src/styles/global.css` |
| 3D scene root | `src/three/Scene.jsx` |
| Camera tween / orbit / auto-rotate | `src/three/CameraController.jsx` |
| Highlight (selected / dimmed) store | `src/three/highlight.js` |
| PBR material library + geometry cache | `src/three/materials.js` |
| Primitives: `P` mesh, `Strut`, `Led`, `ZoneRing` | `src/three/Prim.jsx` |
| Service zones | `SmartHouse.jsx` (house + solar), `SensorSystem.jsx`, `NetworkSystem.jsx`, `CloudServer.jsx` |
| Connection lines + data pulses | `src/three/ConnectionLines.jsx` |
| Floating markers | `src/three/Markers.jsx` |
| No-WebGL / error fallback | `src/three/Fallback.jsx` |

## Swapping in the Blender GLB later

1. Export GLB with the object names from the plan (§17): `SMART_HOUSE`, `SOLAR_PANELS`,
   `SOLAR_INVERTER`, `RND_SENSOR_HUB`, `NETWORK_TOWER`, `CLOUD_SERVER_RACK`, `CLOUD_CORE`, …
2. Load it with drei `useGLTF` in a new `SmartCityGltf.jsx`; for each node, set
   `node.material.userData.base = { color, ei }` and call `registerMaterial(group, node.material)`
   (see `materials.js`) so the highlight system dims/boosts it; keep the `HitBox` components.
3. Replace the four system components inside `<group name="KHOME_SCENE">` in `Scene.jsx`.
   Camera targets, markers, panel and highlight logic stay untouched.

## Deploy (later)

Static output — copy `dist/` to an LXC running nginx and add it as an HAProxy backend,
same pattern as the other Beconnected sites.

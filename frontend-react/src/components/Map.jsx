import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

export default function Map({ reports = [], onLocationSelect, center = [-98.5, 39.5], zoom = 4 }) {
  const mapContainer = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])

  useEffect(() => {
    if (mapRef.current) return

    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center,
      zoom,
    })

    mapRef.current.addControl(new maplibregl.NavigationControl(), 'top-right')

    if (onLocationSelect) {
      mapRef.current.on('click', (e) => {
        onLocationSelect({ lat: e.lngLat.lat, lng: e.lngLat.lng })
      })
    }

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  // Fly to new center when it changes
  useEffect(() => {
    if (!mapRef.current) return
    mapRef.current.flyTo({ center, zoom, duration: 1500 })
  }, [center[0], center[1], zoom])

  // Add/update markers
  useEffect(() => {
    if (!mapRef.current) return
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    const colors = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444', critical: '#7c3aed' }

    reports.forEach((report) => {
      if (!report.latitude || !report.longitude) return
      const el = document.createElement('div')
      el.style.cssText = `width:16px;height:16px;border-radius:50%;background:${colors[report.severity] || '#6b7280'};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);cursor:pointer;`

      const popup = new maplibregl.Popup({ offset: 12 }).setHTML(`
        <strong>${report.hazard_type}</strong><br/>
        Severity: ${report.severity}<br/>
        ${report.description?.slice(0, 80)}
      `)

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([report.longitude, report.latitude])
        .setPopup(popup)
        .addTo(mapRef.current)

      markersRef.current.push(marker)
    })
  }, [reports])

  return <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
}
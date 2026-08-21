import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '../lib/utils';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  category?: string;
  priority?: string;
  color?: string;
}

interface SimpleMapProps {
  markers?: MapMarker[];
  center?: { lat: number; lng: number };
  height?: string;
  className?: string;
  onMarkerClick?: (id: string) => void;
  selectable?: boolean;
  onLocationSelect?: (lat: number, lng: number) => void;
  showHeatmap?: boolean;
}

const PRIORITY_COLORS: Record<string, string> = {
  Low: '#6b7280',
  Medium: '#3b82f6',
  High: '#f97316',
  Critical: '#ef4444',
};

const CATEGORY_COLORS: Record<string, string> = {
  Garbage: '#10b981',
  'Overflowing Garbage': '#059669',
  'Road Damage': '#f59e0b',
  Potholes: '#d97706',
  'Broken Streetlight': '#eab308',
  'Water Leakage': '#3b82f6',
  'Drainage Blockage': '#06b6d4',
  'Sewage Overflow': '#0284c7',
  'Illegal Dumping': '#84cc16',
  'Tree Fallen': '#16a34a',
  'Traffic Signal Damage': '#dc2626',
  'Public Property Damage': '#8b5cf6',
  Others: '#6b7280',
};

function createIcon(color: string): L.DivIcon {
  const svg = `
    <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 22 14 22s14-11.5 14-22c0-7.73-6.27-14-14-14z" fill="${color}"/>
      <circle cx="14" cy="14" r="5" fill="white"/>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: 'custom-marker',
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
  });
}

const centerIcon = L.divIcon({
  html: `<div style="position:relative;"><div style="width:32px;height:32px;border-radius:50%;background:#4f46e5;border:4px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg></div><div style="position:absolute;top:-8px;left:-8px;width:48px;height:48px;border-radius:50%;background:rgba(79,70,229,0.3);animation:pulse 2s infinite;"></div></div>`,
  className: 'custom-center-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function MapClickHandler({ onLocationSelect }: { onLocationSelect?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapResizer({ center }: { center?: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 100);
  }, [map]);
  useEffect(() => {
    if (center) {
      map.setView([center.lat, center.lng], Math.max(map.getZoom(), 15));
      setTimeout(() => map.invalidateSize(), 50);
    }
  }, [center?.lat, center?.lng, map]);
  return null;
}

export function SimpleMap({
  markers = [],
  center,
  height = '400px',
  className,
  onMarkerClick,
  selectable = false,
  onLocationSelect,
}: SimpleMapProps) {
  const mapCenter: [number, number] = center
    ? [center.lat, center.lng]
    : markers.length > 0
      ? [markers[0].lat, markers[0].lng]
      : [20, 0];

  const zoom = center || markers.length > 0 ? 15 : 2;

  return (
    <div
      className={cn('relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 z-0', className)}
      style={{ height }}
    >
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%', cursor: selectable ? 'crosshair' : 'default' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapResizer center={center} />
        {selectable && onLocationSelect && <MapClickHandler onLocationSelect={onLocationSelect} />}

        {center && <Marker position={[center.lat, center.lng]} icon={centerIcon} />}

        {markers.map((m) => {
          const color = m.color ?? PRIORITY_COLORS[m.priority ?? 'Medium'] ?? CATEGORY_COLORS[m.category ?? 'Others'] ?? '#3b82f6';
          return (
            <Marker
              key={m.id}
              position={[m.lat, m.lng]}
              icon={createIcon(color)}
              eventHandlers={{ click: () => onMarkerClick?.(m.id) }}
            >
              {m.label && (
                <Popup>
                  <div className="text-sm font-medium">{m.label}</div>
                </Popup>
              )}
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

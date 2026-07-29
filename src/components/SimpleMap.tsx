import { useState, useRef } from 'react';
import { MapPin, Navigation, Layers } from 'lucide-react';
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

/**
 * A lightweight interactive map component that renders markers on a grid.
 * Uses a normalized coordinate system to display markers without requiring
 * an external maps API. In production, this would use Google Maps.
 */
export function SimpleMap({
  markers = [],
  center,
  height = '400px',
  className,
  onMarkerClick,
  selectable = false,
  onLocationSelect,
  showHeatmap = false,
}: SimpleMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  // Normalize marker positions to 0-100% range
  const allLats = markers.map((m) => m.lat);
  const allLngs = markers.map((m) => m.lng);
  if (center) {
    allLats.push(center.lat);
    allLngs.push(center.lng);
  }
  const minLat = Math.min(...allLats, 0) - 0.01;
  const maxLat = Math.max(...allLats, 0) + 0.01;
  const minLng = Math.min(...allLngs, 0) - 0.01;
  const maxLng = Math.max(...allLngs, 0) + 0.01;

  const normalize = (lat: number, lng: number) => {
    const x = ((lng - minLng) / (maxLng - minLng || 1)) * 100;
    const y = (1 - (lat - minLat) / (maxLat - minLat || 1)) * 100;
    return { x: Math.max(2, Math.min(98, x)), y: Math.max(2, Math.min(98, y)) };
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectable || !onLocationSelect || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const lat = minLat + (1 - y / 100) * (maxLat - minLat);
    const lng = minLng + (x / 100) * (maxLng - minLng);
    onLocationSelect(lat, lng);
  };

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className={cn(
        'relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-blue-50 via-green-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 cursor-default',
        selectable && 'cursor-crosshair',
        className,
      )}
      style={{ height }}
    >
      {/* Grid background */}
      <div className="absolute inset-0 opacity-30">
        <svg className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-gray-400" />
            </pattern>
            <pattern id="grid-major" width="200" height="200" patternUnits="userSpaceOnUse">
              <path d="M 200 0 L 0 0 0 200" fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-500" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <rect width="100%" height="100%" fill="url(#grid-major)" />
        </svg>
      </div>

      {/* Simulated roads */}
      <svg className="absolute inset-0 w-full h-full opacity-20" preserveAspectRatio="none">
        <path d="M 0 30% Q 50% 25% 100% 35%" stroke="#94a3b8" strokeWidth="3" fill="none" />
        <path d="M 0 60% L 100% 55%" stroke="#94a3b8" strokeWidth="2" fill="none" />
        <path d="M 30% 0 L 35% 100%" stroke="#94a3b8" strokeWidth="2" fill="none" />
        <path d="M 70% 0 Q 65% 50% 75% 100%" stroke="#94a3b8" strokeWidth="3" fill="none" />
      </svg>

      {/* Heatmap overlay */}
      {showHeatmap && markers.length > 0 && (
        <div className="absolute inset-0">
          {markers.map((m) => {
            const pos = normalize(m.lat, m.lng);
            const color = m.color ?? PRIORITY_COLORS[m.priority ?? 'Medium'] ?? CATEGORY_COLORS[m.category ?? 'Others'] ?? '#3b82f6';
            return (
              <div
                key={`heat-${m.id}`}
                className="absolute rounded-full blur-xl opacity-40"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  width: '80px',
                  height: '80px',
                  transform: 'translate(-50%, -50%)',
                  background: color,
                }}
              />
            );
          })}
        </div>
      )}

      {/* Center marker */}
      {center && (
        <div
          className="absolute z-10"
          style={{
            left: `${normalize(center.lat, center.lng).x}%`,
            top: `${normalize(center.lat, center.lng).y}%`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-brand-600 border-4 border-white shadow-lg flex items-center justify-center">
              <Navigation className="w-4 h-4 text-white" />
            </div>
            <div className="absolute -inset-2 rounded-full bg-brand-500/30 animate-ping" />
          </div>
        </div>
      )}

      {/* Markers */}
      {markers.map((m) => {
        const pos = normalize(m.lat, m.lng);
        const color = m.color ?? PRIORITY_COLORS[m.priority ?? 'Medium'] ?? CATEGORY_COLORS[m.category ?? 'Others'] ?? '#3b82f6';
        const isSelected = selected === m.id;
        const isHovered = hovered === m.id;
        return (
          <div key={m.id}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelected(isSelected ? null : m.id);
                onMarkerClick?.(m.id);
              }}
              onMouseEnter={() => setHovered(m.id)}
              onMouseLeave={() => setHovered(null)}
              className="absolute z-20 transition-all"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: 'translate(-50%, -100%)',
              }}
            >
              <div
                className={cn('relative transition-transform', (isSelected || isHovered) && 'scale-125')}
              >
                <svg width="28" height="36" viewBox="0 0 28 36" fill="none" className="drop-shadow-lg">
                  <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 22 14 22s14-11.5 14-22c0-7.73-6.27-14-14-14z" fill={color} />
                  <circle cx="14" cy="14" r="5" fill="white" />
                </svg>
              </div>
            </button>

            {/* Tooltip */}
            {(isSelected || isHovered) && m.label && (
              <div
                className="absolute z-30 pointer-events-none"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: 'translate(-50%, -130%)',
                }}
              >
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-900 dark:text-white whitespace-nowrap">
                  {m.label}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Legend */}
      <div className="absolute bottom-3 left-3 glass-card rounded-xl p-2.5 text-xs">
        <div className="flex items-center gap-1.5 mb-1.5 text-gray-600 dark:text-gray-300 font-semibold">
          <Layers className="w-3.5 h-3.5" />
          Map Legend
        </div>
        <div className="space-y-1">
          {Object.entries(PRIORITY_COLORS).map(([priority, color]) => (
            <div key={priority} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              <span className="text-gray-600 dark:text-gray-400">{priority}</span>
            </div>
          ))}
        </div>
      </div>

      {markers.length === 0 && !center && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <MapPin className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No locations to display</p>
          </div>
        </div>
      )}
    </div>
  );
}

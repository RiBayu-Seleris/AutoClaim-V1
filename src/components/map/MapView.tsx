import { useEffect } from 'react';
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';
import { LatLngBounds, type LatLngExpression } from 'leaflet';
import { cn } from '@/lib/utils/cn';
import {
  DEFAULT_MAP_ZOOM,
  MAP_PIN_COLOR,
  OSM_TILE_ATTRIBUTION,
  OSM_TILE_URL,
  type MapPinVariant,
  type MapPoint,
} from './leafletConfig';

export type { MapPoint };

export interface MapMarker extends MapPoint {
  label?: string;
  variant?: MapPinVariant;
}

interface MapViewProps {
  center: MapPoint;
  zoom?: number;
  markers?: MapMarker[];
  /** Garis penghubung antar titik (mis. sopir → lokasi jemput). */
  polyline?: MapPoint[];
  /** Sesuaikan tampilan agar semua marker terlihat. */
  fitToMarkers?: boolean;
  className?: string;
}

/** Mengarahkan ulang peta saat pusat berubah atau saat fit-to-markers diminta. */
function MapAutoView({
  center,
  zoom,
  markers,
  fitToMarkers,
}: {
  center: MapPoint;
  zoom: number;
  markers: MapMarker[];
  fitToMarkers: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (fitToMarkers && markers.length > 1) {
      const bounds = new LatLngBounds(markers.map((m) => [m.lat, m.lng] as LatLngExpression));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      return;
    }
    map.setView([center.lat, center.lng], zoom);
  }, [map, center.lat, center.lng, zoom, fitToMarkers, markers]);

  return null;
}

/**
 * Peta tampilan (read-only) berbasis OpenStreetMap: menampilkan marker
 * berwarna sesuai peran + garis rute opsional.
 */
export function MapView({
  center,
  zoom = DEFAULT_MAP_ZOOM,
  markers = [],
  polyline,
  fitToMarkers = false,
  className,
}: MapViewProps) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      scrollWheelZoom={false}
      className={cn('h-56 w-full overflow-hidden rounded-lg', className)}
    >
      <TileLayer url={OSM_TILE_URL} attribution={OSM_TILE_ATTRIBUTION} />
      {polyline && polyline.length > 1 && (
        <Polyline
          positions={polyline.map((p) => [p.lat, p.lng] as LatLngExpression)}
          pathOptions={{ color: MAP_PIN_COLOR.driver, weight: 4, opacity: 0.7 }}
        />
      )}
      {markers.map((marker, index) => (
        <CircleMarker
          key={`${marker.lat}-${marker.lng}-${index}`}
          center={[marker.lat, marker.lng]}
          radius={9}
          pathOptions={{
            color: '#FFFFFF',
            weight: 3,
            fillColor: MAP_PIN_COLOR[marker.variant ?? 'default'],
            fillOpacity: 1,
          }}
        >
          {marker.label && (
            <Tooltip direction="top" offset={[0, -8]}>
              {marker.label}
            </Tooltip>
          )}
        </CircleMarker>
      ))}
      <MapAutoView center={center} zoom={zoom} markers={markers} fitToMarkers={fitToMarkers} />
    </MapContainer>
  );
}

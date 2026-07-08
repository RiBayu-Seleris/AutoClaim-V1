import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Navigation, MapPin, Clock } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { AppHeader } from '@/components/layout/AppHeader';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/feedback/StateViews';
import { MapView, type MapMarker, type MapPoint } from '@/components/map/MapView';
import { DEFAULT_MAP_POINT } from '@/components/map/leafletConfig';
import { formatRelativeTime } from '@/lib/utils/format';
import { getTowingOrder, getTowingTracking } from '../api/towingApi';
import { towingStatusLabel } from '../types';

const DRIVER_LOCATION_POLL_MS = 10_000;

function targetLabel(target: string): string {
  if (target === 'pickup') return 'menuju lokasi Anda';
  if (target === 'dropoff') return 'menuju tujuan';
  return '';
}

/** Koordinat dianggap valid bila bukan (0,0) dan berhingga. */
function hasCoord(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0);
}

export function TowingTrackingPage() {
  const { code = '' } = useParams();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['towing-tracking', code],
    queryFn: () => getTowingTracking(code),
    refetchInterval: DRIVER_LOCATION_POLL_MS,
  });
  // Order dipakai untuk titik lokasi jemput pada peta.
  const { data: order } = useQuery({
    queryKey: ['towing-order', code],
    queryFn: () => getTowingOrder(code),
    enabled: code.length > 0,
  });

  return (
    <PageContainer>
      <AppHeader title="Lacak Towing" />
      {isLoading ? (
        <LoadingState label="Memuat posisi sopir…" />
      ) : isError || !data ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : (
        (() => {
          const driver: MapPoint | null =
            data.hasLocation && hasCoord(data.driverLatitude, data.driverLongitude)
              ? { lat: data.driverLatitude, lng: data.driverLongitude }
              : null;
          const pickup: MapPoint | null =
            order && hasCoord(order.pickupLatitude, order.pickupLongitude)
              ? { lat: order.pickupLatitude, lng: order.pickupLongitude }
              : null;

          const markers: MapMarker[] = [];
          if (driver) markers.push({ ...driver, label: 'Sopir', variant: 'driver' });
          if (pickup) markers.push({ ...pickup, label: 'Lokasi jemput', variant: 'origin' });

          return (
            <div className="flex flex-1 flex-col gap-4 px-5 py-5">
              {markers.length > 0 ? (
                <MapView
                  center={driver ?? pickup ?? DEFAULT_MAP_POINT}
                  markers={markers}
                  polyline={driver && pickup ? [driver, pickup] : undefined}
                  fitToMarkers={markers.length > 1}
                />
              ) : (
                <div className="bg-deep-blue-50 relative flex h-56 items-center justify-center overflow-hidden rounded-lg">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#c7cee2_0,transparent_45%),radial-gradient(circle_at_70%_70%,#acb6d4_0,transparent_40%)]" />
                  <div className="text-deep-blue-600 relative flex flex-col items-center gap-2">
                    <Navigation className="size-10" />
                    <span className="text-12 font-medium">Menunggu lokasi sopir</span>
                  </div>
                </div>
              )}

              <Card className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-12 text-neutral-700">Status</span>
                  <span className="text-12 font-semibold text-neutral-900">
                    {towingStatusLabel(data.status)}
                  </span>
                </div>
                {targetLabel(data.target) && (
                  <div className="text-12 flex items-center gap-2 text-neutral-800">
                    <MapPin className="text-deep-blue-500 size-4" /> Sopir {targetLabel(data.target)}
                  </div>
                )}
                {data.distanceKm > 0 && (
                  <div className="text-12 flex items-center gap-2 text-neutral-800">
                    <Navigation className="text-deep-blue-500 size-4" /> Perkiraan jarak{' '}
                    {data.distanceKm.toFixed(1)} km
                  </div>
                )}
                {data.lastSeenAt && (
                  <div className="text-12 flex items-center gap-2 text-neutral-700">
                    <Clock className="size-4" /> Diperbarui {formatRelativeTime(data.lastSeenAt)}
                  </div>
                )}
              </Card>

              <p className="text-10 text-center text-neutral-600">
                Posisi diperbarui otomatis setiap beberapa detik.
              </p>
            </div>
          );
        })()
      )}
    </PageContainer>
  );
}

import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, ExternalLink } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/feedback/StateViews';
import { MapView, type MapMarker, type MapPoint } from '@/components/map/MapView';
import { ROUTES } from '@/app/routes';
import type { RecommendationPlace, WorkshopVisitRequest } from '../api';

/** Koordinat dianggap valid bila bukan (0,0) dan berhingga. */
function hasCoord(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0);
}

export function WorkshopRoutePage() {
  const navigate = useNavigate();
  const routeState = useLocation().state as
    | RecommendationPlace
    | { place?: RecommendationPlace; visit?: WorkshopVisitRequest }
    | null;
  const place =
    routeState && 'place' in routeState
      ? (routeState.place ?? null)
      : (routeState as RecommendationPlace | null);
  const [userPoint, setUserPoint] = useState<MapPoint | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPoint({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => undefined,
      { timeout: 10_000 },
    );
  }, []);

  if (!place) {
    return (
      <PageContainer>
        <AppHeader title="Rute Bengkel" />
        <EmptyState
          title="Rute tidak tersedia"
          description="Pilih bengkel terlebih dahulu."
          action={
            <Button fullWidth={false} onClick={() => navigate(ROUTES.workshopList)}>
              Lihat Daftar Bengkel
            </Button>
          }
        />
      </PageContainer>
    );
  }

  const workshop: MapPoint | null = hasCoord(place.latitude, place.longitude)
    ? { lat: place.latitude, lng: place.longitude }
    : null;
  const markers: MapMarker[] = [];
  if (workshop) markers.push({ ...workshop, label: place.name, variant: 'destination' });
  if (userPoint) markers.push({ ...userPoint, label: 'Lokasi Anda', variant: 'origin' });

  const mapsUrl =
    place.gmapsUrl ||
    (workshop
      ? `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`);

  return (
    <PageContainer className="bg-white">
      <AppHeader showLogo />

      {/* Peta dominan */}
      <div className="relative flex-1">
        {workshop ? (
          <MapView
            center={workshop}
            markers={markers}
            polyline={userPoint ? [userPoint, workshop] : undefined}
            fitToMarkers={markers.length > 1}
            className="h-full rounded-none"
          />
        ) : (
          <div className="bg-deep-blue-50 flex h-full items-center justify-center">
            <p className="text-12 px-6 text-center text-neutral-600">
              Koordinat bengkel belum tersedia. Gunakan tautan di bawah untuk membuka peta.
            </p>
          </div>
        )}
      </div>

      {/* Kartu rute + Berhenti */}
      <div className="border-t border-neutral-300 bg-white px-5 pt-4 pb-safe">
        <p className="text-center text-16 font-semibold text-neutral-900">
          {place.estimatedMinutes > 0 ? `${Math.round(place.estimatedMinutes)} Menit` : 'Rute'}
          {place.distanceKm > 0 && ` · ${place.distanceKm.toFixed(1)} km`}
        </p>
        <p className="mt-0.5 text-center text-12 text-neutral-600">Menuju {place.name}</p>

        <a
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="text-deep-blue-600 mt-3 inline-flex w-full items-center justify-center gap-1.5 text-12 font-medium"
        >
          <ExternalLink className="size-4" /> Buka navigasi di peta
        </a>

        <Button
          variant="danger"
          className="mt-3"
          leftIcon={<X className="size-5" />}
          onClick={() => navigate(-1)}
        >
          Berhenti
        </Button>
      </div>
    </PageContainer>
  );
}

import { useNavigate } from 'react-router-dom';
import { MapPin, Phone, Star, Truck } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { AppHeader } from '@/components/layout/AppHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/app/routes';

interface ServicePlace {
  name: string;
  distanceKm: number;
  rating: number;
  phone: string;
}

const HOSPITALS: ServicePlace[] = [
  { name: 'RS Siloam', distanceKm: 1.2, rating: 4.7, phone: '0211500911' },
  { name: 'RSUD Kota', distanceKm: 2.5, rating: 4.5, phone: '0215698000' },
  { name: 'RS Premier', distanceKm: 3.1, rating: 4.6, phone: '0212997000' },
];

const TOWING: ServicePlace[] = [
  { name: 'Derek Cepat 24 Jam', distanceKm: 0.8, rating: 4.8, phone: '081200001111' },
  { name: 'Towing Andalan', distanceKm: 1.9, rating: 4.6, phone: '081200002222' },
  { name: 'Auto Rescue', distanceKm: 2.7, rating: 4.4, phone: '081200003333' },
];

export function EmergencyServicePage({ variant }: { variant: 'hospital' | 'towing' }) {
  const navigate = useNavigate();
  const isTowing = variant === 'towing';
  const places = isTowing ? TOWING : HOSPITALS;
  const title = isTowing ? 'Towing Terdekat' : 'Rumah Sakit Darurat';

  return (
    <PageContainer>
      <AppHeader title={title} />
      <div className="flex flex-1 flex-col px-5 py-6">
        <div className="text-12 flex items-center gap-2 text-neutral-700">
          <MapPin className="size-4" /> Layanan terdekat dari lokasi Anda
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {places.map((place) => (
            <Card key={place.name} className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-14 font-semibold text-neutral-900">{place.name}</p>
                <div className="text-12 mt-1 flex items-center gap-3 text-neutral-700">
                  <span className="inline-flex items-center gap-1">
                    <Star className="text-warning size-3.5" /> {place.rating}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5" /> {place.distanceKm} km
                  </span>
                </div>
              </div>
              <a
                href={`tel:${place.phone}`}
                aria-label={`Telepon ${place.name}`}
                className="bg-green-cust/15 text-green-cust flex size-10 items-center justify-center rounded-full"
              >
                <Phone className="size-5" />
              </a>
            </Card>
          ))}
        </div>

        {isTowing && (
          <div className="mt-auto pt-8">
            <Button
              size="lg"
              leftIcon={<Truck className="size-5" />}
              onClick={() => navigate(ROUTES.towingOrder)}
            >
              Pesan Towing Sekarang
            </Button>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

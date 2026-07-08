import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Car, Plus, Pencil, Trash2 } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { AppHeader } from '@/components/layout/AppHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/Spinner';
import { ErrorState, EmptyState } from '@/components/feedback/StateViews';
import { confirm } from '@/components/feedback/confirm';
import { toast } from '@/components/feedback/toast';
import { extractErrorMessage } from '@/lib/api/client';
import { ROUTES } from '@/app/routes';
import { getVehicles, deleteVehicle } from '../api';
import { hasPolis, type SavedVehicle } from '../types';

export function MyVehiclesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['vehicles'],
    queryFn: getVehicles,
  });

  const remove = useMutation({
    mutationFn: (plate: string) => deleteVehicle(plate),
    onSuccess: () => {
      toast.success('Kendaraan dihapus.');
      void queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
    onError: (error) => toast.error(extractErrorMessage(error, 'Gagal menghapus kendaraan.')),
  });

  const handleDelete = async (v: SavedVehicle) => {
    const ok = await confirm({
      title: 'Hapus kendaraan',
      message: `Hapus ${v.vehicleName} (${v.vehiclePlate})?`,
      confirmText: 'Hapus',
      tone: 'danger',
    });
    if (ok) remove.mutate(v.vehiclePlate);
  };

  return (
    <PageContainer>
      <AppHeader title="Kendaraan Saya" />
      <div className="flex flex-1 flex-col px-5 py-5">
        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : !data || data.length === 0 ? (
          <EmptyState
            icon={<Car className="size-7" />}
            title="Belum ada kendaraan"
            description="Tambahkan kendaraan untuk mempercepat proses klaim."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {data.map((v) => (
              <Card key={v.vehiclePlate} className="flex items-center gap-3">
                <div className="bg-deep-blue-50 text-deep-blue-500 flex size-11 items-center justify-center rounded-lg">
                  <Car className="size-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-14 truncate font-semibold text-neutral-900">{v.vehicleName}</p>
                  <p className="text-12 text-neutral-700">
                    {v.vehiclePlate} · {v.vehicleType}
                  </p>
                  {hasPolis(v) && (
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge tone="green">Berpolis</Badge>
                      <span className="text-[11px] text-neutral-600">
                        {v.polisNumber} · {formatVehicleDate(v.polisEnd)}
                      </span>
                    </div>
                  )}
                </div>
                {!hasPolis(v) && (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      aria-label="Ubah"
                      onClick={() => navigate(ROUTES.vehicleForm, { state: v })}
                      className="flex size-9 items-center justify-center rounded-full text-neutral-700 hover:bg-neutral-200"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Hapus"
                      onClick={() => handleDelete(v)}
                      className="text-danger hover:bg-danger/10 flex size-9 items-center justify-center rounded-full"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        <div className="mt-auto pt-6">
          <Button
            size="lg"
            leftIcon={<Plus className="size-5" />}
            onClick={() => navigate(ROUTES.vehicleForm)}
          >
            Tambah Kendaraan
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}

function formatVehicleDate(value: string): string {
  if (!value || value === '-') return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, RefreshCw, XCircle } from 'lucide-react';
import { ROUTES } from '@/app/routes';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/Spinner';
import { toast } from '@/components/feedback/toast';
import { confirm } from '@/components/feedback/confirm';
import { extractErrorMessage } from '@/lib/api/client';
import { cn } from '@/lib/utils/cn';
import { MitraShell } from '../../components/MitraShell';
import { MapPreview } from '../../components/MapPreview';
import {
  getMitraTowingOrders,
  rejectMitraTowingOrder,
  subscribeMitraTowingOrderChanges,
  towingStatusLabel,
  type MitraTowingOrder,
} from '../../api';

const FILTERS = [
  { value: 'all', label: 'Semua' },
  { value: 'OFFERED', label: 'Masuk' },
  { value: 'ASSIGNED', label: 'Ditugaskan' },
  { value: 'COMPLETED', label: 'Selesai' },
] as const;

/** Daftar order derek masuk: terima atau lihat detail. */
export function OrderListPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<MitraTowingOrder[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['value']>('all');
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<number | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await getMitraTowingOrders({ limit: 100 });
      setOrders(res.data);
    } catch (error) {
      if (!silent) {
        toast.error(extractErrorMessage(error, 'Gagal memuat order towing.'));
        setOrders([]);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    return subscribeMitraTowingOrderChanges({
      onChange: () => void load(true),
    });
  }, [load]);

  const filtered = useMemo(() => {
    if (filter === 'all') return orders;
    if (filter === 'COMPLETED') {
      return orders.filter((o) => o.status === 'COMPLETED' || o.status === 'DROPPED_OFF');
    }
    return orders.filter((o) => o.status === filter);
  }, [filter, orders]);

  const handleReject = async (order: MitraTowingOrder) => {
    const ok = await confirm({
      title: 'Tolak Order',
      message: `Tolak order ${order.orderCode || `#${order.id}`} dan teruskan ke provider lain?`,
      confirmText: 'Tolak',
      tone: 'danger',
    });
    if (!ok) return;
    setRejectingId(order.id);
    try {
      await rejectMitraTowingOrder(order.id);
      setOrders((current) => current.filter((item) => item.id !== order.id));
      toast.success('Order ditolak dan akan diteruskan.');
      void load(true);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Gagal menolak order.'));
    } finally {
      setRejectingId(null);
    }
  };

  return (
    <MitraShell>
      <AppHeader
        title="Order Masuk"
        rightSlot={
          <button
            type="button"
            onClick={() => void load()}
            aria-label="Muat ulang order"
            className="text-deep-blue-500 grid size-9 place-items-center rounded-full bg-white"
          >
            <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
          </button>
        }
      />

      <div className="px-5 pt-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={cn(
                'text-12 shrink-0 rounded-full px-3 py-1.5 font-semibold',
                filter === item.value
                  ? 'bg-deep-blue-600 text-white'
                  : 'bg-white text-neutral-600 shadow-sm',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid flex-1 place-items-center">
          <LoadingState label="Memuat order towing…" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="px-5 py-16 text-center">
          <div className="bg-deep-blue-50 text-deep-blue-500 mx-auto grid size-12 place-items-center rounded-full">
            <Clock className="size-6" />
          </div>
          <p className="text-14 mt-3 font-semibold text-neutral-900">Belum ada order</p>
          <p className="text-12 mt-1 text-neutral-500">
            Order dari user akan muncul di sini setelah auto-dispatch menawarkan ke mitra ini.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-4 px-5">
          {filtered.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              rejecting={rejectingId === order.id}
              onDetail={() => navigate(ROUTES.mitraOrderTracking, { state: { order } })}
              onAccept={() => navigate(ROUTES.mitraPenugasan, { state: { order } })}
              onReject={() => void handleReject(order)}
            />
          ))}
        </div>
      )}
    </MitraShell>
  );
}

function OrderCard({
  order,
  onDetail,
  onAccept,
  onReject,
  rejecting,
}: {
  order: MitraTowingOrder;
  onDetail: () => void;
  onAccept: () => void;
  onReject: () => void;
  rejecting: boolean;
}) {
  const isOffered = order.status === 'OFFERED';
  const distanceLabel =
    order.pickupLatitude !== 0 || order.pickupLongitude !== 0 ? 'Lokasi aktif' : 'Lokasi manual';
  const vehicle = order.inferenceTicket ? `Ticket ${order.inferenceTicket}` : 'Permintaan towing';

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-semibold tracking-wide text-neutral-400 uppercase">
          {towingStatusLabel(order.status)}
        </span>
        <div className="text-right">
          <p className="text-deep-blue-600 text-14 font-bold">{order.orderCode || `#${order.id}`}</p>
          <p className="text-[11px] text-neutral-500">{distanceLabel}</p>
        </div>
      </div>

      <p className="text-16 mt-1 font-bold text-neutral-900">{order.userFullname || vehicle}</p>
      {order.userPhone && <p className="text-12 text-neutral-500">{order.userPhone}</p>}
      <p className="text-12 mt-1 flex items-start gap-1.5 text-neutral-500">
        <MapPin className="text-deep-blue-500 mt-0.5 size-4 shrink-0" />
        {order.pickupAddress}
      </p>

      <MapPreview className="mt-3 h-32" />

      {isOffered ? (
        <div className="mt-3 grid grid-cols-[1fr_1fr_1.3fr] gap-2">
          <Button variant="outline" onClick={onDetail}>
            Detail
          </Button>
          <Button
            variant="outline"
            className="border-danger text-danger hover:bg-danger/5"
            leftIcon={<XCircle className="size-4" />}
            onClick={onReject}
            isLoading={rejecting}
          >
            Tolak
          </Button>
          <Button onClick={onAccept}>Tugaskan</Button>
        </div>
      ) : (
        <div className="mt-3">
          <Button variant="outline" onClick={onDetail}>
            Detail
          </Button>
        </div>
      )}
    </div>
  );
}

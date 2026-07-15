import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  ClipboardList,
  FileText,
  Headphones,
  History,
  Home,
  IdCard,
  LogOut,
  MapPin,
  Navigation,
  Phone,
  Search,
  ShieldCheck,
  Star,
  Truck,
  UserCircle,
  Wallet,
  X,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { AppHeader } from '@/components/layout/AppHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/Spinner';
import { ErrorState, EmptyState } from '@/components/feedback/StateViews';
import { confirm } from '@/components/feedback/confirm';
import { toast } from '@/components/feedback/toast';
import { MapView, type MapMarker, type MapPoint } from '@/components/map/MapView';
import { DEFAULT_MAP_POINT } from '@/components/map/leafletConfig';
import { ROUTES } from '@/app/routes';
import { useDriverStore } from '@/features/auth/store/driverStore';
import { extractErrorMessage } from '@/lib/api/client';
import { cn } from '@/lib/utils/cn';
import { formatCurrency, formatDateTime, formatRelativeTime } from '@/lib/utils/format';
import {
  getDriverTasks,
  rejectDriverOrder,
  scanDriverSettlementCode,
  settleDriverSettlementCode,
  subscribeDriverTowingOrderChanges,
  updateDriverLocation,
  updateDriverTaskStatus,
} from '../api/driverApi';
import { FleetInspection } from '../components/FleetInspection';
import {
  driverDestinationLabel,
  driverNeedsInspection,
  driverNextActionLabel,
  driverNextStatus,
  driverStatusLabel,
  driverTaskPlate,
  driverTaskProblem,
  driverTaskRevenue,
  isDriverTaskCanceled,
  isDriverTaskFinished,
  type DriverTask,
} from '../types';

type DriverTab = 'home' | 'orders' | 'history' | 'account';
type DriverScreen =
  | { kind: 'tabs' }
  | { kind: 'detail'; task: DriverTask }
  | { kind: 'accepted'; task: DriverTask }
  | { kind: 'inspection'; task: DriverTask }
  | { kind: 'tracking'; task: DriverTask }
  | { kind: 'biodata' };
type BadgeTone = 'neutral' | 'blue' | 'green' | 'yellow' | 'red';
type AdvanceAfter = 'accepted' | 'inspection' | 'tracking' | 'stay';

const ACTIVE_STATUSES = new Set([
  'ASSIGNED',
  'ACCEPTED_BY_DRIVER',
  'EN_ROUTE_TO_PICKUP',
  'ARRIVED_PICKUP',
  'PICKED_UP',
  'EN_ROUTE_TO_DROPOFF',
]);

const DRIVER_STEPS = [
  { status: 'ASSIGNED', label: 'Order masuk' },
  { status: 'ACCEPTED_BY_DRIVER', label: 'Cek armada' },
  { status: 'EN_ROUTE_TO_PICKUP', label: 'Menuju jemput' },
  { status: 'ARRIVED_PICKUP', label: 'Tiba jemput' },
  { status: 'PICKED_UP', label: 'Mobil diangkut' },
  { status: 'EN_ROUTE_TO_DROPOFF', label: 'Menuju tujuan' },
  { status: 'DROPPED_OFF', label: 'Selesai drop-off' },
] as const;

function hasCoord(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0);
}

function statusTone(status: string): BadgeTone {
  if (isDriverTaskFinished(status)) return 'green';
  if (isDriverTaskCanceled(status)) return 'red';
  if (status === 'ASSIGNED') return 'yellow';
  return 'blue';
}

function taskTime(task: DriverTask): string {
  return task.assignedAt ?? task.requestedAt ?? task.completedAt ?? '';
}

function taskTimestampLabel(task: DriverTask): string {
  const value = taskTime(task);
  return value ? formatRelativeTime(value) : '-';
}

function destinationPoint(task: DriverTask): MapPoint | null {
  if (!hasCoord(task.dropoffLatitude, task.dropoffLongitude)) return null;
  return { lat: task.dropoffLatitude, lng: task.dropoffLongitude };
}

function pickupPoint(task: DriverTask): MapPoint | null {
  if (!hasCoord(task.pickupLatitude, task.pickupLongitude)) return null;
  return { lat: task.pickupLatitude, lng: task.pickupLongitude };
}

function driverInitial(name: string): string {
  const initial = name.trim().charAt(0).toUpperCase();
  return initial || 'S';
}

function progressIndex(status: string): number {
  if (status === 'COMPLETED') return DRIVER_STEPS.length - 1;
  const index = DRIVER_STEPS.findIndex((step) => step.status === status);
  return index >= 0 ? index : 0;
}

function sumRevenue(tasks: DriverTask[]): number {
  return tasks.reduce((sum, task) => sum + driverTaskRevenue(task), 0);
}

function kmEstimate(tasks: DriverTask[]): number {
  const done = tasks.filter((task) => isDriverTaskFinished(task.status)).length;
  return done * 18 + tasks.filter((task) => ACTIVE_STATUSES.has(task.status)).length * 6;
}

export function DriverTasksPage() {
  const navigate = useNavigate();
  const name = useDriverStore((s) => s.name);
  const logout = useDriverStore((s) => s.logout);
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<DriverTab>('home');
  const [screen, setScreen] = useState<DriverScreen>({ kind: 'tabs' });

  const { data = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['driver-tasks'],
    queryFn: getDriverTasks,
    staleTime: 10_000,
  });

  useEffect(() => {
    return subscribeDriverTowingOrderChanges({
      onChange: () => {
        void queryClient.invalidateQueries({ queryKey: ['driver-tasks'] });
      },
    });
  }, [queryClient]);

  const taskByCode = useMemo(() => {
    const map = new Map<string, DriverTask>();
    data.forEach((task) => map.set(task.orderCode, task));
    return map;
  }, [data]);

  const activeTasks = useMemo(
    () =>
      data.filter((task) => ACTIVE_STATUSES.has(task.status)).sort((a, b) => {
        const left = new Date(taskTime(a)).getTime() || 0;
        const right = new Date(taskTime(b)).getTime() || 0;
        return right - left;
      }),
    [data],
  );
  const finishedTasks = useMemo(
    () => data.filter((task) => isDriverTaskFinished(task.status)),
    [data],
  );
  const currentTask = activeTasks[0] ?? null;

  const advance = useMutation({
    mutationFn: ({ task, status }: { task: DriverTask; status: string; after: AdvanceAfter }) =>
      updateDriverTaskStatus(task.orderCode, status),
    onSuccess: (status, variables) => {
      const updated = { ...variables.task, status };
      void queryClient.invalidateQueries({ queryKey: ['driver-tasks'] });
      if (variables.after === 'accepted') {
        setScreen({ kind: 'accepted', task: updated });
      } else if (variables.after === 'inspection') {
        setScreen({ kind: 'inspection', task: updated });
      } else if (variables.after === 'tracking') {
        setScreen({ kind: 'tracking', task: updated });
      } else {
        setScreen((prev) => {
          if (prev.kind !== 'detail' && prev.kind !== 'accepted' && prev.kind !== 'tracking') {
            return prev;
          }
          if (prev.task.orderCode !== updated.orderCode) {
            return prev;
          }
          if (prev.kind === 'detail') return { kind: 'detail', task: updated };
          if (prev.kind === 'accepted') return { kind: 'accepted', task: updated };
          return { kind: 'tracking', task: updated };
        });
      }
      toast.success('Status order diperbarui.');
    },
    onError: (error) => toast.error(extractErrorMessage(error, 'Status order gagal diperbarui.')),
  });

  const reject = useMutation({
    mutationFn: ({ code, note }: { code: string; note: string }) => rejectDriverOrder(code, note),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['driver-tasks'] });
      toast.success('Order ditolak dan dikembalikan ke admin mitra.');
      setScreen({ kind: 'tabs' });
    },
    onError: (error) => toast.error(extractErrorMessage(error, 'Order gagal ditolak.')),
  });

  const selectedTask =
    screen.kind === 'detail' ||
    screen.kind === 'accepted' ||
    screen.kind === 'inspection' ||
    screen.kind === 'tracking'
      ? taskByCode.get(screen.task.orderCode) ?? screen.task
      : null;

  // Membuka layar kerja sesuai tahap: ASSIGNED→detail, ACCEPTED_BY_DRIVER→cek
  // armada, selain itu→tracking.
  const openTask = (task: DriverTask) => {
    if (task.status === 'ASSIGNED') {
      setScreen({ kind: 'detail', task });
    } else if (driverNeedsInspection(task.status)) {
      setScreen({ kind: 'inspection', task });
    } else {
      setScreen({ kind: 'tracking', task });
    }
  };

  const handleAccept = (task: DriverTask) => {
    if (task.status === 'ASSIGNED') {
      // Terima → status ACCEPTED_BY_DRIVER, lalu langsung ke cek armada.
      advance.mutate({ task, status: 'ACCEPTED_BY_DRIVER', after: 'inspection' });
      return;
    }
    openTask(task);
  };

  const handleReject = async (task: DriverTask) => {
    const ok = await confirm({
      title: 'Tolak order ini?',
      message: 'Order dikembalikan ke admin mitra untuk ditugaskan ke sopir lain.',
      confirmText: 'Tolak',
      tone: 'danger',
    });
    if (!ok) return;
    const note = window.prompt('Alasan menolak (boleh dikosongkan):') ?? '';
    reject.mutate({ code: task.orderCode, note });
  };

  const handleAdvanceTracking = (task: DriverTask) => {
    const next = driverNextStatus(task.status);
    if (!next) return;
    advance.mutate({ task, status: next, after: 'tracking' });
  };

  const handleTabChange = (nextTab: DriverTab) => {
    setScreen({ kind: 'tabs' });
    setTab(nextTab);
  };

  const handleLogout = async () => {
    const ok = await confirm({
      title: 'Keluar akun sopir',
      message: 'Anda akan kembali ke portal login AutoClaim.',
      confirmText: 'Keluar',
      tone: 'danger',
    });
    if (!ok) return;
    logout();
    navigate(ROUTES.loginSopir, { replace: true });
  };

  if (isLoading) {
    return (
      <PageContainer className="bg-[#F5F7FB]">
        <LoadingState label="Memuat portal sopir..." />
      </PageContainer>
    );
  }

  if (isError) {
    return (
      <PageContainer className="bg-[#F5F7FB]">
        <AppHeader title="Portal Sopir" showBack={false} />
        <ErrorState onRetry={() => void refetch()} />
      </PageContainer>
    );
  }

  if (screen.kind === 'detail' && selectedTask) {
    return (
      <OrderDetailScreen
        task={selectedTask}
        isUpdating={advance.isPending || reject.isPending}
        onBack={() => setScreen({ kind: 'tabs' })}
        onAccept={() => handleAccept(selectedTask)}
        onReject={() => handleReject(selectedTask)}
        onTrack={() => openTask(selectedTask)}
      />
    );
  }

  if (screen.kind === 'accepted' && selectedTask) {
    return (
      <AcceptedOrderScreen
        task={selectedTask}
        onBack={() => setScreen({ kind: 'tabs' })}
        onStart={() => setScreen({ kind: 'tracking', task: selectedTask })}
      />
    );
  }

  if (screen.kind === 'inspection' && selectedTask) {
    return (
      <FleetInspection
        task={selectedTask}
        onBack={() => setScreen({ kind: 'tabs' })}
        onDone={(verdict) => {
          void queryClient.invalidateQueries({ queryKey: ['driver-tasks'] });
          if (verdict === 'FIT') {
            advance.mutate({ task: selectedTask, status: 'EN_ROUTE_TO_PICKUP', after: 'tracking' });
          } else {
            setScreen({ kind: 'tabs' });
          }
        }}
      />
    );
  }

  if (screen.kind === 'tracking' && selectedTask) {
    return (
      <TrackingOrderScreen
        task={selectedTask}
        isUpdating={advance.isPending}
        onBack={() => setScreen({ kind: 'tabs' })}
        onAdvance={() => handleAdvanceTracking(selectedTask)}
      />
    );
  }

  if (screen.kind === 'biodata') {
    return (
      <BiodataScreen
        name={name}
        tasks={data}
        activeTask={currentTask}
        onBack={() => setScreen({ kind: 'tabs' })}
      />
    );
  }

  return (
    <PageContainer className="bg-[#F5F7FB]">
      {tab === 'home' && (
        <DriverHome
          name={name}
          tasks={data}
          activeTasks={activeTasks}
          finishedTasks={finishedTasks}
          currentTask={currentTask}
          onOpenOrders={() => handleTabChange('orders')}
          onOpenHistory={() => handleTabChange('history')}
          onOpenAccount={() => handleTabChange('account')}
          onOpenDetail={(task) => setScreen({ kind: 'detail', task })}
          onTrack={openTask}
        />
      )}
      {tab === 'orders' && (
        <DriverOrders
          tasks={data}
          activeTasks={activeTasks}
          finishedCount={finishedTasks.length}
          isUpdating={advance.isPending || reject.isPending}
          onOpenDetail={(task) => setScreen({ kind: 'detail', task })}
          onAccept={(task) => handleAccept(task)}
          onReject={(task) => handleReject(task)}
          onTrack={openTask}
        />
      )}
      {tab === 'history' && <DriverHistory tasks={data} />}
      {tab === 'account' && (
        <DriverAccount
          name={name}
          tasks={data}
          activeTask={currentTask}
          onOpenBiodata={() => setScreen({ kind: 'biodata' })}
          onLogout={handleLogout}
        />
      )}
      <DriverBottomNav active={tab} onChange={handleTabChange} />
    </PageContainer>
  );
}

function DriverHome({
  name,
  tasks,
  activeTasks,
  finishedTasks,
  currentTask,
  onOpenOrders,
  onOpenHistory,
  onOpenAccount,
  onOpenDetail,
  onTrack,
}: {
  name: string;
  tasks: DriverTask[];
  activeTasks: DriverTask[];
  finishedTasks: DriverTask[];
  currentTask: DriverTask | null;
  onOpenOrders: () => void;
  onOpenHistory: () => void;
  onOpenAccount: () => void;
  onOpenDetail: (task: DriverTask) => void;
  onTrack: (task: DriverTask) => void;
}) {
  const displayName = name || 'Sopir Towing';
  const revenue = sumRevenue(finishedTasks);
  const rating = finishedTasks.length > 0 ? '4.9' : '-';

  return (
    <main className="flex flex-1 flex-col pb-24">
      <section className="bg-[#3F5FA8] px-5 pb-8 pt-5 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/assets/auth/logo-autoclaim.png" alt="AutoClaim" className="h-8 w-auto" />
            <span className="text-16 font-semibold">Driver</span>
          </div>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-full bg-white/15 text-white"
            aria-label="Notifikasi"
          >
            <Bell className="size-5" />
          </button>
        </div>

        <div className="mt-7 flex items-center gap-4">
          <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-white text-2xl font-bold text-[#3F5FA8]">
            {driverInitial(displayName)}
          </div>
          <div className="min-w-0">
            <p className="text-12 text-white/75">Selamat bekerja</p>
            <h1 className="truncate text-xl font-bold">{displayName}</h1>
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-10 font-semibold">
              <CircleDot className="size-3 text-[#8BE28B]" /> Online
            </span>
          </div>
        </div>
      </section>

      <section className="-mt-5 grid grid-cols-3 gap-3 px-5">
        <QuickCard icon={<IdCard className="size-5" />} label="Data Sopir" onClick={onOpenAccount} />
        <QuickCard
          icon={<ClipboardList className="size-5" />}
          label="Order"
          value={String(activeTasks.length)}
          onClick={onOpenOrders}
        />
        <QuickCard icon={<FileText className="size-5" />} label="Laporan" onClick={onOpenHistory} />
      </section>

      <section className="flex flex-col gap-4 px-5 pt-5">
        <div className="flex items-center justify-between">
          <h2 className="text-16 font-bold text-neutral-900">Info Orderan</h2>
          <button type="button" onClick={onOpenOrders} className="text-12 font-semibold text-[#3F5FA8]">
            Lihat semua
          </button>
        </div>

        {currentTask ? (
          <CurrentOrderCard task={currentTask} onDetail={() => onOpenDetail(currentTask)} onTrack={() => onTrack(currentTask)} />
        ) : (
          <EmptyDriverPanel
            icon={<Truck className="size-7" />}
            title="Belum ada order aktif"
            description="Order baru akan muncul otomatis saat admin mitra menugaskan Anda."
          />
        )}

        <div className="grid grid-cols-2 gap-3">
          <MetricCard icon={<CheckCircle2 className="size-5" />} label="Selesai" value={`${finishedTasks.length}`} />
          <MetricCard icon={<Wallet className="size-5" />} label="Pendapatan" value={formatCurrency(revenue)} compact />
        </div>

        <Card className="border-0 bg-white shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-12 text-neutral-600">Rating Sopir</p>
              <div className="mt-1 flex items-center gap-2">
                <Star className="size-6 fill-[#F5B942] text-[#F5B942]" />
                <span className="text-2xl font-bold text-neutral-900">{rating}</span>
              </div>
            </div>
            <div className="rounded-2xl bg-[#EAF0FF] px-4 py-3 text-right">
              <p className="text-10 font-semibold text-[#3F5FA8]">Total KM</p>
              <p className="text-18 font-bold text-neutral-900">{kmEstimate(tasks)} KM</p>
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}

function DriverOrders({
  tasks,
  activeTasks,
  finishedCount,
  isUpdating,
  onOpenDetail,
  onAccept,
  onReject,
  onTrack,
}: {
  tasks: DriverTask[];
  activeTasks: DriverTask[];
  finishedCount: number;
  isUpdating: boolean;
  onOpenDetail: (task: DriverTask) => void;
  onAccept: (task: DriverTask) => void;
  onReject: (task: DriverTask) => void;
  onTrack: (task: DriverTask) => void;
}) {
  const assigned = activeTasks.filter((task) => task.status === 'ASSIGNED');
  const ongoing = activeTasks.filter((task) => task.status !== 'ASSIGNED');

  return (
    <main className="flex flex-1 flex-col pb-24">
      <section className="bg-[#3F5FA8] px-5 pb-7 pt-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-12 text-white/75">Portal Sopir</p>
            <h1 className="text-2xl font-bold">Orderan</h1>
          </div>
          <Badge tone="green" className="bg-white/15 text-white">
            Online
          </Badge>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3">
          <OrderStat value={String(finishedCount)} label="Selesai" />
          <OrderStat value={finishedCount > 0 ? '4.9' : '-'} label="Rating" />
          <OrderStat value={`${kmEstimate(tasks)}`} label="KM Total" />
        </div>
      </section>

      <section className="flex flex-col gap-4 px-5 pt-5">
        {assigned.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-16 font-bold text-neutral-900">Order Masuk</h2>
              <Badge tone="yellow">{assigned.length} baru</Badge>
            </div>
            {assigned.map((task) => (
              <IncomingOrderCard
                key={task.orderCode}
                task={task}
                isUpdating={isUpdating}
                onDetail={() => onOpenDetail(task)}
                onAccept={() => onAccept(task)}
                onReject={() => onReject(task)}
              />
            ))}
          </>
        )}

        {ongoing.length > 0 && (
          <>
            <h2 className="text-16 font-bold text-neutral-900">Sedang Dikerjakan</h2>
            {ongoing.map((task) => (
              <OngoingOrderCard key={task.orderCode} task={task} onTrack={() => onTrack(task)} />
            ))}
          </>
        )}

        {activeTasks.length === 0 && (
          <EmptyState
            icon={<ClipboardList className="size-7" />}
            title="Belum ada order"
            description="Order towing baru akan muncul otomatis saat ditugaskan ke akun Anda."
          />
        )}

        <SafetyTip />
      </section>

      <FloatingSupport />
    </main>
  );
}

function DriverHistory({ tasks }: { tasks: DriverTask[] }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'done' | 'canceled' | 'progress'>('done');

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesFilter =
        filter === 'done'
          ? isDriverTaskFinished(task.status)
          : filter === 'canceled'
            ? isDriverTaskCanceled(task.status)
            : ACTIVE_STATUSES.has(task.status);
      if (!matchesFilter) return false;
      if (!keyword) return true;
      return [task.orderCode, task.userFullname, task.pickupAddress, driverDestinationLabel(task)]
        .join(' ')
        .toLowerCase()
        .includes(keyword);
    });
  }, [filter, query, tasks]);

  return (
    <main className="flex flex-1 flex-col gap-4 px-5 pb-24 pt-5">
      <div>
        <p className="text-12 text-neutral-600">Riwayat kerja</p>
        <h1 className="text-2xl font-bold text-neutral-900">History</h1>
      </div>

      <label className="flex h-12 items-center gap-3 rounded-xl border border-neutral-300 bg-white px-4 shadow-sm">
        <Search className="size-5 text-neutral-500" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari kode, customer, atau lokasi"
          className="text-12 min-w-0 flex-1 bg-transparent text-neutral-900 outline-none placeholder:text-neutral-500"
        />
      </label>

      <div className="grid grid-cols-3 gap-2 rounded-xl bg-neutral-300 p-1">
        <HistoryFilter active={filter === 'done'} label="Selesai" onClick={() => setFilter('done')} />
        <HistoryFilter active={filter === 'canceled'} label="Dibatalkan" onClick={() => setFilter('canceled')} />
        <HistoryFilter active={filter === 'progress'} label="Proses" onClick={() => setFilter('progress')} />
      </div>

      {filtered.length === 0 ? (
        <EmptyDriverPanel
          icon={<History className="size-7" />}
          title="Riwayat kosong"
          description="Riwayat sesuai filter akan muncul di sini."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((task) => (
            <HistoryCard key={task.orderCode} task={task} />
          ))}
        </div>
      )}
    </main>
  );
}

function DriverAccount({
  name,
  tasks,
  activeTask,
  onOpenBiodata,
  onLogout,
}: {
  name: string;
  tasks: DriverTask[];
  activeTask: DriverTask | null;
  onOpenBiodata: () => void;
  onLogout: () => void;
}) {
  const displayName = name || 'Sopir Towing';
  const finished = tasks.filter((task) => isDriverTaskFinished(task.status));
  const latestFleet = tasks.find((task) => task.fleetPlateNumber || task.fleetType);

  return (
    <main className="flex flex-1 flex-col gap-4 px-5 pb-24 pt-5">
      <div className="rounded-[28px] bg-[#3F5FA8] p-5 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="grid size-18 place-items-center rounded-2xl bg-white text-3xl font-bold text-[#3F5FA8]">
            {driverInitial(displayName)}
          </div>
          <div className="min-w-0">
            <p className="text-12 text-white/75">Akun Sopir</p>
            <h1 className="truncate text-xl font-bold">{displayName}</h1>
            <p className="text-12 text-white/80">{latestFleet?.towingName || 'Mitra Towing'}</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          <ProfileStat value={String(finished.length)} label="Order" />
          <ProfileStat value={finished.length > 0 ? '4.9' : '-'} label="Rating" />
          <ProfileStat value={formatCurrency(sumRevenue(finished))} label="Saldo" />
        </div>
      </div>

      <Card className="border-0 shadow-md">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-12 text-neutral-600">Armada Aktif</p>
            <p className="truncate text-16 font-bold text-neutral-900">
              {latestFleet?.fleetPlateNumber || activeTask?.fleetPlateNumber || '-'}
            </p>
            <p className="text-12 text-neutral-600">{latestFleet?.fleetType || activeTask?.fleetType || 'Towing'}</p>
          </div>
          <Truck className="size-9 text-[#3F5FA8]" />
        </div>
      </Card>

      <div className="flex flex-col gap-2">
        <AccountMenuItem icon={<IdCard className="size-5" />} label="Data Sopir Towing" onClick={onOpenBiodata} />
        <AccountMenuItem icon={<ShieldCheck className="size-5" />} label="Dokumen & Verifikasi" onClick={onOpenBiodata} />
        <AccountMenuItem icon={<Headphones className="size-5" />} label="Bantuan Operasional" href={`tel:6281234567890`} />
        <AccountMenuItem icon={<LogOut className="size-5" />} label="Keluar" tone="danger" onClick={onLogout} />
      </div>
    </main>
  );
}

function OrderDetailScreen({
  task,
  isUpdating,
  onBack,
  onAccept,
  onReject,
  onTrack,
}: {
  task: DriverTask;
  isUpdating: boolean;
  onBack: () => void;
  onAccept: () => void;
  onReject: () => void;
  onTrack: () => void;
}) {
  const isAssigned = task.status === 'ASSIGNED';
  const needsInspection = driverNeedsInspection(task.status);

  return (
    <PageContainer className="bg-[#F5F7FB]">
      <AppHeader title="Konfirmasi Orderan" onBack={onBack} />
      <main className="flex flex-1 flex-col gap-4 px-5 py-5">
        <Card className="border-0 shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Badge tone={statusTone(task.status)}>{driverStatusLabel(task.status)}</Badge>
              <h1 className="mt-3 text-20 font-bold text-neutral-900">{task.userFullname || 'Customer'}</h1>
              <p className="text-12 text-neutral-600">#{task.orderCode}</p>
            </div>
            <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[#EAF0FF] text-[#3F5FA8]">
              <Truck className="size-7" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <InfoPill label="Kendaraan" value={driverTaskPlate(task)} />
            <InfoPill label="Keluhan" value={driverTaskProblem(task)} />
          </div>
        </Card>

        <Card className="border-0 shadow-md">
          <h2 className="text-16 font-bold text-neutral-900">Rute Pengantaran</h2>
          <RouteLine origin={task.pickupAddress || '-'} destination={driverDestinationLabel(task)} />
        </Card>

        <Card className="border-0 shadow-md">
          <h2 className="text-16 font-bold text-neutral-900">Data Customer</h2>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-14 font-semibold text-neutral-900">{task.userFullname || '-'}</p>
              <p className="text-12 text-neutral-600">{task.userPhone || '-'}</p>
            </div>
            {task.userPhone && (
              <a
                href={`tel:${task.userPhone}`}
                className="grid size-11 shrink-0 place-items-center rounded-full bg-[#3F5FA8] text-white"
                aria-label="Telepon customer"
              >
                <Phone className="size-5" />
              </a>
            )}
          </div>
        </Card>

        <div className="rounded-2xl bg-[#EAF7EE] p-4">
          <p className="text-12 font-semibold text-[#237A3A]">Estimasi Pendapatan</p>
          <p className="mt-1 text-2xl font-bold text-neutral-900">{formatCurrency(driverTaskRevenue(task))}</p>
        </div>

        {isAssigned ? (
          <div className="mt-auto grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-12 rounded-2xl border-danger text-danger hover:bg-danger/5"
              disabled={isUpdating}
              onClick={onReject}
            >
              Tolak
            </Button>
            <Button className="h-12 rounded-2xl" isLoading={isUpdating} onClick={onAccept}>
              Konfirmasi Terima
            </Button>
          </div>
        ) : (
          <div className="mt-auto grid grid-cols-[56px_1fr] gap-3">
            <Button variant="danger" className="h-12 rounded-2xl px-0" onClick={onBack} aria-label="Tutup">
              <X className="size-5" />
            </Button>
            <Button className="h-12 rounded-2xl" isLoading={isUpdating} onClick={onTrack}>
              {needsInspection ? 'Cek Armada' : 'Buka Tracking'}
            </Button>
          </div>
        )}
      </main>
    </PageContainer>
  );
}

function AcceptedOrderScreen({
  task,
  onBack,
  onStart,
}: {
  task: DriverTask;
  onBack: () => void;
  onStart: () => void;
}) {
  const pickup = pickupPoint(task);
  const destination = destinationPoint(task);
  const markers = routeMarkers(task);

  return (
    <PageContainer className="bg-[#F5F7FB]">
      <AppHeader title="Order Diterima" onBack={onBack} />
      <main className="flex flex-1 flex-col gap-4 px-5 py-5">
        <section className="flex flex-col items-center text-center">
          <div className="grid size-20 place-items-center rounded-full bg-[#EAF7EE] text-[#2F9B54]">
            <CheckCircle2 className="size-11" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-neutral-900">Order berhasil diterima</h1>
          <p className="text-12 text-neutral-600">#{task.orderCode}</p>
        </section>

        <div className="rounded-2xl bg-white p-4 shadow-md">
          <p className="text-12 text-neutral-600">Estimasi Pendapatan</p>
          <p className="mt-1 text-2xl font-bold text-neutral-900">{formatCurrency(driverTaskRevenue(task))}</p>
        </div>

        <OrderSummaryRows task={task} />

        {markers.length > 0 && (
          <MapView
            center={pickup ?? destination ?? DEFAULT_MAP_POINT}
            markers={markers}
            polyline={pickup && destination ? [pickup, destination] : undefined}
            fitToMarkers={markers.length > 1}
            className="h-52 rounded-2xl"
          />
        )}

        <div className="mt-auto grid grid-cols-[1fr_56px] gap-3">
          <Button className="h-12 rounded-2xl" onClick={onStart} leftIcon={<Navigation className="size-5" />}>
            Mulai Perjalanan
          </Button>
          {task.userPhone && (
            <a
              href={`tel:${task.userPhone}`}
              className="grid h-12 place-items-center rounded-2xl bg-[#EAF0FF] text-[#3F5FA8]"
              aria-label="Telepon customer"
            >
              <Phone className="size-5" />
            </a>
          )}
        </div>
      </main>
    </PageContainer>
  );
}

function TrackingOrderScreen({
  task,
  isUpdating,
  onBack,
  onAdvance,
}: {
  task: DriverTask;
  isUpdating: boolean;
  onBack: () => void;
  onAdvance: () => void;
}) {
  useEffect(() => {
    if (!('geolocation' in navigator)) return undefined;
    let lastSent = 0;
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        if (now - lastSent < 10_000) return;
        lastSent = now;
        void updateDriverLocation(position.coords.latitude, position.coords.longitude).catch(() => undefined);
      },
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10_000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [task.orderCode]);

  const pickup = pickupPoint(task);
  const destination = destinationPoint(task);
  const markers = routeMarkers(task);
  const next = driverNextStatus(task.status);

  return (
    <PageContainer className="bg-white">
      <div className="relative h-[360px] shrink-0 overflow-hidden bg-[#DDE6F6]">
        <MapView
          center={pickup ?? destination ?? DEFAULT_MAP_POINT}
          markers={markers}
          polyline={pickup && destination ? [pickup, destination] : undefined}
          fitToMarkers={markers.length > 1}
          className="h-full rounded-none"
        />
        <button
          type="button"
          onClick={onBack}
          aria-label="Kembali"
          className="absolute left-4 top-4 grid size-10 place-items-center rounded-full bg-white text-[#3F5FA8] shadow-md"
        >
          <ChevronRight className="size-6 rotate-180" />
        </button>
        <Badge tone={statusTone(task.status)} className="absolute right-4 top-4 bg-white shadow-md">
          {driverStatusLabel(task.status)}
        </Badge>
      </div>

      <main className="-mt-8 flex flex-1 flex-col gap-4 rounded-t-[28px] bg-white px-5 pb-5 pt-5 shadow-[0_-12px_28px_rgb(31_48_91_/_0.12)]">
        <div className="mx-auto h-1.5 w-12 rounded-full bg-neutral-300" />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-12 text-neutral-600">Customer</p>
            <h1 className="truncate text-20 font-bold text-neutral-900">{task.userFullname || '-'}</h1>
            <p className="text-12 text-neutral-600">#{task.orderCode}</p>
          </div>
          {task.userPhone && (
            <a
              href={`tel:${task.userPhone}`}
              className="grid size-12 shrink-0 place-items-center rounded-full bg-[#3F5FA8] text-white"
              aria-label="Telepon customer"
            >
              <Phone className="size-5" />
            </a>
          )}
        </div>

        <RouteLine origin={task.pickupAddress || '-'} destination={driverDestinationLabel(task)} />
        <DriverProgress status={task.status} />

        {next ? (
          <Button className="mt-auto h-12 rounded-2xl" isLoading={isUpdating} onClick={onAdvance}>
            {driverNextActionLabel(task.status)}
          </Button>
        ) : task.claimNumber ? (
          <DriverSettlementBox task={task} />
        ) : (
          <div className="mt-auto rounded-2xl bg-[#EAF7EE] p-4 text-center text-14 font-semibold text-[#237A3A]">
            Tugas drop-off selesai
          </div>
        )}
      </main>
    </PageContainer>
  );
}

function DriverSettlementBox({ task }: { task: DriverTask }) {
  const queryClient = useQueryClient();
  const [code, setCode] = useState(task.orderCode);

  useEffect(() => {
    setCode(task.orderCode);
  }, [task.orderCode]);

  const scan = useMutation({
    mutationFn: () => scanDriverSettlementCode(code.trim()),
    onSuccess: () => {
      toast.success('Tiket klaim valid.');
    },
    onError: (error) => toast.error(extractErrorMessage(error, 'Tiket klaim tidak valid.')),
  });

  const settle = useMutation({
    mutationFn: () => settleDriverSettlementCode(code.trim()),
    onSuccess: (flag) => {
      void queryClient.invalidateQueries({ queryKey: ['driver-tasks'] });
      if (flag.status === 'SETTLED') {
        toast.success('Tiket klaim towing selesai.');
      } else if (flag.status === 'AWAITING_PAYMENT') {
        toast.success('Tiket tervalidasi. Menunggu pembayaran user.');
      } else {
        toast.success('Tiket klaim diperbarui.');
      }
    },
    onError: (error) => toast.error(extractErrorMessage(error, 'Tiket klaim gagal diselesaikan.')),
  });

  const disabled = code.trim().length === 0 || scan.isPending || settle.isPending;

  return (
    <div className="mt-auto flex flex-col gap-3 rounded-2xl bg-[#F3F6FC] p-4">
      <div>
        <p className="text-12 font-semibold text-neutral-900">Kode tiket klaim</p>
        <p className="text-11 mt-1 text-neutral-600">Input kode dari tiket user setelah drop-off selesai.</p>
      </div>
      <label className="flex h-12 items-center rounded-xl border border-neutral-300 bg-white px-4">
        <input
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          className="text-14 min-w-0 flex-1 bg-transparent font-semibold tracking-wide text-neutral-900 outline-none placeholder:text-neutral-500"
          placeholder="Masukkan kode tiket"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-12 rounded-2xl"
          disabled={disabled}
          isLoading={scan.isPending}
          onClick={() => scan.mutate()}
        >
          Scan
        </Button>
        <Button
          className="h-12 rounded-2xl"
          disabled={disabled}
          isLoading={settle.isPending}
          onClick={() => settle.mutate()}
        >
          Selesaikan
        </Button>
      </div>
    </div>
  );
}

function BiodataScreen({
  name,
  tasks,
  activeTask,
  onBack,
}: {
  name: string;
  tasks: DriverTask[];
  activeTask: DriverTask | null;
  onBack: () => void;
}) {
  const latestFleet = tasks.find((task) => task.fleetPlateNumber || task.fleetType);
  const displayName = name || 'Sopir Towing';
  const serviceName = latestFleet?.towingName || activeTask?.towingName || 'Mitra Towing';

  return (
    <PageContainer className="bg-[#F5F7FB]">
      <AppHeader title="Biodata Sopir" onBack={onBack} />
      <main className="flex flex-1 flex-col gap-4 px-5 py-5">
        <Card className="border-0 shadow-md">
          <div className="flex items-center gap-4">
            <div className="grid size-18 place-items-center rounded-2xl bg-[#3F5FA8] text-3xl font-bold text-white">
              {driverInitial(displayName)}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-20 font-bold text-neutral-900">{displayName}</h1>
              <p className="text-12 text-neutral-600">{serviceName}</p>
              <Badge tone={activeTask ? 'blue' : 'green'} className="mt-2">
                {activeTask ? 'Sedang bertugas' : 'Siap bertugas'}
              </Badge>
            </div>
          </div>
        </Card>

        <SectionTitle title="Informasi Personal" />
        <Card className="border-0 shadow-md">
          <InfoRow label="Nama Lengkap" value={displayName} />
          <InfoRow label="Perusahaan" value={serviceName} />
          <InfoRow label="Status Kerja" value={activeTask ? driverStatusLabel(activeTask.status) : 'Online'} />
        </Card>

        <SectionTitle title="Armada & Dokumen" />
        <Card className="border-0 shadow-md">
          <InfoRow label="Plat Armada" value={latestFleet?.fleetPlateNumber || activeTask?.fleetPlateNumber || '-'} />
          <InfoRow label="Tipe Armada" value={latestFleet?.fleetType || activeTask?.fleetType || 'Towing'} />
          <InfoRow label="Total Order" value={String(tasks.filter((task) => isDriverTaskFinished(task.status)).length)} />
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" leftIcon={<FileText className="size-5" />}>
            Dokumen
          </Button>
          <Button variant="outline" leftIcon={<ShieldCheck className="size-5" />}>
            Aktif
          </Button>
        </div>
      </main>
    </PageContainer>
  );
}

function QuickCard({
  icon,
  label,
  value,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  value?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl bg-white p-3 text-center shadow-md"
    >
      <span className="grid size-10 place-items-center rounded-xl bg-[#EAF0FF] text-[#3F5FA8]">{icon}</span>
      {value && <span className="text-18 font-bold text-neutral-900">{value}</span>}
      <span className="text-10 font-semibold leading-tight text-neutral-700">{label}</span>
    </button>
  );
}

function MetricCard({
  icon,
  label,
  value,
  compact = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <Card className="border-0 shadow-md">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#EAF0FF] text-[#3F5FA8]">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-10 text-neutral-600">{label}</p>
          <p className={cn('truncate font-bold text-neutral-900', compact ? 'text-14' : 'text-xl')}>
            {value}
          </p>
        </div>
      </div>
    </Card>
  );
}

function CurrentOrderCard({
  task,
  onDetail,
  onTrack,
}: {
  task: DriverTask;
  onDetail: () => void;
  onTrack: () => void;
}) {
  return (
    <Card className="border-0 shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Badge tone={statusTone(task.status)}>{driverStatusLabel(task.status)}</Badge>
          <h3 className="mt-3 truncate text-18 font-bold text-neutral-900">{task.userFullname || 'Customer'}</h3>
          <p className="text-12 text-neutral-600">{driverTaskProblem(task)}</p>
        </div>
        <span className="text-12 font-semibold text-neutral-500">{taskTimestampLabel(task)}</span>
      </div>
      <RouteLine origin={task.pickupAddress || '-'} destination={driverDestinationLabel(task)} compact />
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button variant="outline" size="sm" onClick={onDetail}>
          Detail
        </Button>
        <Button size="sm" onClick={task.status === 'ASSIGNED' ? onDetail : onTrack}>
          {task.status === 'ASSIGNED'
            ? 'Terima'
            : driverNeedsInspection(task.status)
              ? 'Cek Armada'
              : 'Tracking'}
        </Button>
      </div>
    </Card>
  );
}

function IncomingOrderCard({
  task,
  isUpdating,
  onDetail,
  onAccept,
  onReject,
}: {
  task: DriverTask;
  isUpdating: boolean;
  onDetail: () => void;
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <Card className="border-0 shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-12 text-neutral-600">#{task.orderCode}</p>
          <h3 className="truncate text-18 font-bold text-neutral-900">{task.userFullname || 'Customer'}</h3>
          <p className="text-12 text-neutral-600">{driverTaskProblem(task)}</p>
        </div>
        <div className="text-right">
          <p className="text-10 text-neutral-500">{taskTimestampLabel(task)}</p>
          <p className="mt-1 text-14 font-bold text-[#237A3A]">{formatCurrency(driverTaskRevenue(task))}</p>
        </div>
      </div>
      <RouteLine origin={task.pickupAddress || '-'} destination={driverDestinationLabel(task)} compact />
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          size="sm"
          className="border-danger text-danger hover:bg-danger/5"
          disabled={isUpdating}
          onClick={onReject}
        >
          Tolak
        </Button>
        <Button size="sm" isLoading={isUpdating} onClick={onAccept}>
          Terima Order
        </Button>
      </div>
      <button
        type="button"
        onClick={onDetail}
        className="text-12 mt-2 w-full font-semibold text-[#3F5FA8]"
      >
        Lihat detail
      </button>
    </Card>
  );
}

function OngoingOrderCard({ task, onTrack }: { task: DriverTask; onTrack: () => void }) {
  return (
    <Card className="border-0 shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Badge tone={statusTone(task.status)}>{driverStatusLabel(task.status)}</Badge>
          <h3 className="mt-2 truncate text-16 font-bold text-neutral-900">{task.userFullname || 'Customer'}</h3>
          <p className="text-12 text-neutral-600">{driverDestinationLabel(task)}</p>
        </div>
        <Button size="sm" fullWidth={false} onClick={onTrack}>
          {driverNeedsInspection(task.status) ? 'Cek Armada' : 'Tracking'}
        </Button>
      </div>
    </Card>
  );
}

function HistoryCard({ task }: { task: DriverTask }) {
  return (
    <Card className="border-0 shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Badge tone={statusTone(task.status)}>{driverStatusLabel(task.status)}</Badge>
            <span className="text-10 text-neutral-500">#{task.orderCode}</span>
          </div>
          <h3 className="mt-3 truncate text-16 font-bold text-neutral-900">{task.userFullname || 'Customer'}</h3>
          <p className="text-12 truncate text-neutral-600">{driverDestinationLabel(task)}</p>
          <p className="text-10 mt-2 text-neutral-500">{formatDateTime(taskTime(task))}</p>
        </div>
        <p className="shrink-0 text-14 font-bold text-[#237A3A]">{formatCurrency(driverTaskRevenue(task))}</p>
      </div>
    </Card>
  );
}

function OrderSummaryRows({ task }: { task: DriverTask }) {
  return (
    <Card className="border-0 shadow-md">
      <InfoRow label="Kendaraan User" value={driverTaskPlate(task)} />
      <InfoRow label="Armada Towing" value={task.fleetPlateNumber || '-'} />
      <InfoRow label="Tujuan" value={driverDestinationLabel(task)} />
    </Card>
  );
}

function RouteLine({
  origin,
  destination,
  compact = false,
}: {
  origin: string;
  destination: string;
  compact?: boolean;
}) {
  return (
    <div className={cn('mt-4 rounded-2xl bg-[#F3F6FC] p-4', compact && 'p-3')}>
      <RoutePoint icon={<CircleDot className="size-4 text-[#2F9B54]" />} text={origin} />
      <div className="my-2 ml-2 h-5 border-l border-dashed border-neutral-400" />
      <RoutePoint icon={<MapPin className="size-4 text-[#E35151]" />} text={destination} />
    </div>
  );
}

function RoutePoint({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <p className="text-12 min-w-0 flex-1 text-neutral-800">{text}</p>
    </div>
  );
}

function DriverProgress({ status }: { status: string }) {
  const activeIndex = progressIndex(status);
  return (
    <div className="flex flex-col gap-3">
      {DRIVER_STEPS.map((step, index) => {
        const done = index <= activeIndex;
        return (
          <div key={step.status} className="flex items-center gap-3">
            <span
              className={cn(
                'grid size-8 shrink-0 place-items-center rounded-full border text-10 font-bold',
                done ? 'border-[#3F5FA8] bg-[#3F5FA8] text-white' : 'border-neutral-300 bg-white text-neutral-500',
              )}
            >
              {index + 1}
            </span>
            <p className={cn('text-12 font-semibold', done ? 'text-neutral-900' : 'text-neutral-500')}>
              {step.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function routeMarkers(task: DriverTask): MapMarker[] {
  const pickup = pickupPoint(task);
  const destination = destinationPoint(task);
  const markers: MapMarker[] = [];
  if (pickup) markers.push({ ...pickup, label: 'Lokasi jemput', variant: 'origin' });
  if (destination) markers.push({ ...destination, label: driverDestinationLabel(task), variant: 'destination' });
  return markers;
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#F3F6FC] p-3">
      <p className="text-10 font-semibold uppercase text-neutral-500">{label}</p>
      <p className="mt-1 truncate text-12 font-bold text-neutral-900">{value || '-'}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-neutral-200 py-3 last:border-0">
      <p className="text-12 text-neutral-600">{label}</p>
      <p className="text-12 max-w-[58%] text-right font-semibold text-neutral-900">{value || '-'}</p>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <h2 className="text-16 font-bold text-neutral-900">{title}</h2>;
}

function OrderStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white/15 p-3 text-center">
      <p className="text-20 font-bold">{value}</p>
      <p className="text-10 text-white/75">{label}</p>
    </div>
  );
}

function ProfileStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-white/15 p-3">
      <p className="truncate text-14 font-bold">{value}</p>
      <p className="text-10 text-white/75">{label}</p>
    </div>
  );
}

function HistoryFilter({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-10 rounded-lg px-2 text-10 font-semibold transition',
        active ? 'bg-white text-[#3F5FA8] shadow-sm' : 'text-neutral-600',
      )}
    >
      {label}
    </button>
  );
}

function AccountMenuItem({
  icon,
  label,
  href,
  tone,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  href?: string;
  tone?: 'danger';
  onClick?: () => void;
}) {
  const className = cn(
    'flex min-h-14 w-full items-center justify-between rounded-2xl bg-white px-4 text-left shadow-sm',
    tone === 'danger' ? 'text-danger' : 'text-neutral-900',
  );
  const content = (
    <>
      <span className="flex min-w-0 items-center gap-3">
        <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl', tone === 'danger' ? 'bg-danger/10' : 'bg-[#EAF0FF] text-[#3F5FA8]')}>
          {icon}
        </span>
        <span className="truncate text-14 font-semibold">{label}</span>
      </span>
      {tone !== 'danger' && <ChevronRight className="size-5 shrink-0 text-neutral-500" />}
    </>
  );

  if (href) {
    return (
      <a href={href} className={className}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

function EmptyDriverPanel({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-white px-6 py-10 text-center shadow-sm">
      <div className="grid size-14 place-items-center rounded-full bg-[#EAF0FF] text-[#3F5FA8]">{icon}</div>
      <p className="mt-4 text-16 font-bold text-neutral-900">{title}</p>
      <p className="text-12 mt-1 text-neutral-600">{description}</p>
    </div>
  );
}

function SafetyTip() {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-[#FFF7E6] p-4 text-[#8A5A00]">
      <AlertTriangle className="mt-0.5 size-5 shrink-0" />
      <p className="text-12">
        Pastikan titik jemput sesuai dan hubungi customer sebelum mobil dinaikkan ke armada.
      </p>
    </div>
  );
}

function FloatingSupport() {
  return (
    <a
      href="tel:6281234567890"
      className="absolute bottom-24 right-5 z-20 grid size-12 place-items-center rounded-full bg-[#3F5FA8] text-white shadow-lg"
      aria-label="Bantuan operasional"
    >
      <Headphones className="size-5" />
    </a>
  );
}

function DriverBottomNav({ active, onChange }: { active: DriverTab; onChange: (tab: DriverTab) => void }) {
  const items: Array<{ tab: DriverTab; label: string; icon: ReactNode }> = [
    { tab: 'home', label: 'Home', icon: <Home className="size-5" /> },
    { tab: 'orders', label: 'Orderan', icon: <ClipboardList className="size-5" /> },
    { tab: 'history', label: 'History', icon: <History className="size-5" /> },
    { tab: 'account', label: 'Account', icon: <UserCircle className="size-5" /> },
  ];

  return (
    <nav className="sticky bottom-0 z-30 grid grid-cols-4 border-t border-neutral-300 bg-white px-2 py-2 shadow-[0_-8px_24px_rgb(31_48_91_/_0.08)]">
      {items.map((item) => {
        const selected = item.tab === active;
        return (
          <button
            key={item.tab}
            type="button"
            onClick={() => onChange(item.tab)}
            className={cn(
              'flex h-14 flex-col items-center justify-center gap-1 rounded-xl text-10 font-semibold transition',
              selected ? 'bg-[#EAF0FF] text-[#3F5FA8]' : 'text-neutral-500',
            )}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

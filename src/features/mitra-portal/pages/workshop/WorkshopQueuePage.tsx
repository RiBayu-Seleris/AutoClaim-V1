import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarClock, Car, ChevronRight } from 'lucide-react';
import { buildPath } from '@/app/routes';
import { AppHeader } from '@/components/layout/AppHeader';
import { cn } from '@/lib/utils/cn';
import { MitraShell } from '../../components/MitraShell';
import { MitraSearch } from '../../components/MitraSearch';
import { WORKSHOP_JOBS } from '../../data/workshopMock';
import type { WorkshopJob } from '../../types';

const STATUS_META: Record<WorkshopJob['status'], { label: string; tone: string }> = {
  inspection: { label: 'Inspeksi', tone: 'bg-warning/15 text-warning' },
  waiting_parts: { label: 'Tunggu Sparepart', tone: 'bg-neutral-100 text-neutral-600' },
  repairing: { label: 'Dikerjakan', tone: 'bg-deep-blue-50 text-deep-blue-600' },
  ready: { label: 'Siap Ambil', tone: 'bg-green-cust/15 text-green-cust' },
};

/** Daftar pekerjaan aktif di portal bengkel. */
export function WorkshopQueuePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const jobs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return WORKSHOP_JOBS;
    return WORKSHOP_JOBS.filter(
      (job) =>
        job.customerName.toLowerCase().includes(q) ||
        job.vehicle.toLowerCase().includes(q) ||
        job.plateNumber.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <MitraShell>
      <AppHeader title="Antrian Bengkel" />

      <div className="space-y-4 px-5 pt-4">
        <MitraSearch value={query} onChange={setQuery} placeholder="Cari kendaraan atau plat…" />
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            onOpen={() => navigate(buildPath.mitraWorkshopJobDetail(job.id))}
          />
        ))}
      </div>
    </MitraShell>
  );
}

function JobCard({ job, onOpen }: { job: WorkshopJob; onOpen: () => void }) {
  const meta = STATUS_META[job.status];
  return (
    <button
      type="button"
      onClick={onOpen}
      className="block w-full rounded-2xl bg-white p-4 text-left shadow-sm transition active:scale-[0.99]"
    >
      <div className="flex items-start gap-3">
        <span className="bg-deep-blue-50 text-deep-blue-600 grid size-12 shrink-0 place-items-center rounded-xl">
          <Car className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-14 truncate font-semibold text-neutral-900">{job.vehicle}</p>
              <p className="text-12 text-neutral-500">{job.plateNumber} · {job.customerName}</p>
            </div>
            <span className={cn('shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold', meta.tone)}>
              {meta.label}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3">
            <span className="text-12 flex items-center gap-1.5 text-neutral-600">
              <CalendarClock className="size-4" />
              ETA {job.eta}
            </span>
            <ChevronRight className="text-deep-blue-500 size-5" />
          </div>
        </div>
      </div>
    </button>
  );
}

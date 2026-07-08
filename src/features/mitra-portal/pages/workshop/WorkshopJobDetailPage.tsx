import { useNavigate, useParams } from 'react-router-dom';
import { Camera, CheckCircle2, ClipboardCheck, MapPin, Wallet, Wrench } from 'lucide-react';
import { ROUTES } from '@/app/routes';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/feedback/toast';
import { MitraShell } from '../../components/MitraShell';
import { findWorkshopJob } from '../../data/workshopMock';

function rupiah(value: number): string {
  return 'Rp ' + value.toLocaleString('id-ID');
}

/** Detail pekerjaan bengkel: ringkasan kendaraan, checklist, estimasi, dan aksi laporan. */
export function WorkshopJobDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const job = findWorkshopJob(id);

  if (!job) {
    return (
      <MitraShell>
        <AppHeader title="Detail Pekerjaan" />
        <div className="px-5 py-16 text-center">
          <p className="text-14 font-semibold text-neutral-900">Pekerjaan tidak ditemukan</p>
          <Button className="mt-5" onClick={() => navigate(ROUTES.mitraWorkshopJobs)}>
            Kembali
          </Button>
        </div>
      </MitraShell>
    );
  }

  return (
    <MitraShell>
      <AppHeader title="Detail Pekerjaan" />

      <div className="px-5 py-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="bg-deep-blue-50 text-deep-blue-600 grid size-12 place-items-center rounded-xl">
              <Wrench className="size-6" />
            </span>
            <div className="min-w-0">
              <p className="text-16 font-bold text-neutral-900">{job.vehicle}</p>
              <p className="text-12 text-neutral-500">{job.plateNumber} · {job.customerName}</p>
              <p className="text-12 mt-2 flex items-start gap-1.5 text-neutral-600">
                <MapPin className="text-deep-blue-500 mt-0.5 size-4 shrink-0" />
                {job.address}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-[11px] text-neutral-500">Severity</p>
            <p className="text-14 font-bold text-neutral-900">{job.severity}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-[11px] text-neutral-500">Estimasi selesai</p>
            <p className="text-14 font-bold text-neutral-900">{job.eta}</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-14 font-semibold text-neutral-900">Checklist Pengerjaan</p>
            <ClipboardCheck className="text-deep-blue-500 size-5" />
          </div>
          <div className="mt-3 space-y-3">
            {job.tasks.map((task, index) => (
              <div key={task} className="flex items-center gap-3">
                <span className="bg-green-cust/15 text-green-cust grid size-7 place-items-center rounded-full">
                  <CheckCircle2 className="size-4" />
                </span>
                <span className="text-12 text-neutral-700">{index + 1}. {task}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold tracking-wide text-neutral-500">ESTIMASI BIAYA</p>
          <p className="text-deep-blue-700 mt-1 text-2xl font-bold">{rupiah(job.estimate)}</p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            leftIcon={<Camera className="size-5" />}
            onClick={() => toast.info('Upload foto progres segera hadir.')}
          >
            Foto Progres
          </Button>
          <Button
            leftIcon={<Wallet className="size-5" />}
            onClick={() => navigate(ROUTES.mitraLaporanDetail.replace(':id', job.id))}
          >
            Buat Laporan
          </Button>
        </div>
      </div>
    </MitraShell>
  );
}

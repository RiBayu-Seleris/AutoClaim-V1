import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { confirm } from '@/components/feedback/confirm';
import { ROUTES } from '@/app/routes';
import { useMitraStore } from '@/features/auth/store/mitraStore';
import { MitraShell } from '../components/MitraShell';

/** Tab Akun portal mitra: profil ringkas + keluar. */
export function MitraAkunPage() {
  const navigate = useNavigate();
  const name = useMitraStore((s) => s.name);
  const role = useMitraStore((s) => s.role);
  const logout = useMitraStore((s) => s.logout);

  const handleLogout = async () => {
    const ok = await confirm({
      title: 'Keluar',
      message: 'Yakin keluar dari portal mitra?',
      confirmText: 'Keluar',
      tone: 'danger',
    });
    if (!ok) return;
    logout();
    navigate(ROUTES.loginMitra, { replace: true });
  };

  return (
    <MitraShell>
      <AppHeader title="Akun" />
      <div className="px-5 py-6">
        <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm">
          <div className="bg-deep-blue-50 text-deep-blue-600 grid size-14 place-items-center rounded-full">
            <User className="size-7" />
          </div>
          <div className="min-w-0">
            <p className="text-14 font-semibold text-neutral-900">{name || 'Mitra'}</p>
            <p className="text-12 text-neutral-600 capitalize">{role.replace(/_/g, ' ')}</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="mt-6"
          leftIcon={<LogOut className="size-5" />}
          onClick={handleLogout}
        >
          Keluar
        </Button>
      </div>
    </MitraShell>
  );
}

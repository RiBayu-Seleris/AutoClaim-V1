import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, CircleAlert } from 'lucide-react';
import { ROUTES } from '@/app/routes';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { activateAccount } from '../api/authApi';
import type { User } from '../types';

type ActivationState =
  | { status: 'loading'; user?: undefined; message?: undefined }
  | { status: 'success'; user: User; message?: undefined }
  | { status: 'error'; user?: undefined; message: string };

function loginTargetFor(user?: User): string {
  switch (user?.userRole) {
    case 'towing_admin':
    case 'workshop_admin':
      return ROUTES.loginMitra;
    case 'towing_driver':
      return ROUTES.loginSopir;
    default:
      return ROUTES.loginUser;
  }
}

function roleLabel(user?: User): string {
  switch (user?.userRole) {
    case 'towing_admin':
      return 'mitra towing';
    case 'workshop_admin':
      return 'mitra bengkel';
    case 'insurance_admin':
      return 'mitra asuransi';
    case 'towing_driver':
      return 'sopir towing';
    default:
      return 'pengguna';
  }
}

export function ActivatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token')?.trim() ?? '', [searchParams]);
  const [state, setState] = useState<ActivationState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    if (!token) {
      setState({
        status: 'error',
        message: 'Token aktivasi tidak ditemukan. Buka kembali link aktivasi dari email.',
      });
      return;
    }

    void activateAccount(token)
      .then((user) => {
        if (active) setState({ status: 'success', user });
      })
      .catch(() => {
        if (!active) return;
        setState({
          status: 'error',
          message: 'Link aktivasi tidak valid, sudah dipakai, atau sudah kedaluwarsa.',
        });
      });

    return () => {
      active = false;
    };
  }, [token]);

  const loginTarget = loginTargetFor(state.user);

  return (
    <AuthLayout
      title={state.status === 'success' ? 'Akun Berhasil Diaktifkan' : 'Aktivasi Akun'}
      subtitle={
        state.status === 'loading'
          ? 'Kami sedang memverifikasi link aktivasi Anda.'
          : state.status === 'success'
            ? `Akun ${roleLabel(state.user)} Anda sudah aktif.`
            : state.message
      }
    >
      <div className="mx-auto mt-4 flex w-full max-w-sm flex-col items-center gap-5 text-center">
        {state.status === 'loading' && (
          <div className="border-deep-blue-500 size-14 animate-spin rounded-full border-4 border-t-transparent" />
        )}

        {state.status === 'success' && (
          <CheckCircle2 className="text-success size-16" aria-hidden />
        )}

        {state.status === 'error' && <CircleAlert className="text-danger size-16" aria-hidden />}

        {state.status === 'success' ? (
          <Button onClick={() => navigate(loginTarget, { replace: true })}>
            Masuk Sekarang
          </Button>
        ) : (
          <Button
            variant={state.status === 'error' ? 'outline' : 'primary'}
            isLoading={state.status === 'loading'}
            disabled={state.status === 'loading'}
            onClick={() => navigate(ROUTES.login, { replace: true })}
          >
            {state.status === 'loading' ? 'Mengaktifkan Akun' : 'Kembali ke Login'}
          </Button>
        )}
      </div>
    </AuthLayout>
  );
}

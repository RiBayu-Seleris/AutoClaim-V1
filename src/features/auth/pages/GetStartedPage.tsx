import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/app/routes';
import { useAppStore } from '@/app/appStore';

export function GetStartedPage() {
  const navigate = useNavigate();
  const markOnboardingSeen = useAppStore((s) => s.markOnboardingSeen);

  const handleStart = () => {
    markOnboardingSeen();
    navigate(ROUTES.home, { replace: true });
  };

  return (
    <main className="min-h-dvh w-full max-w-[393px] bg-neutral-200 sm:mx-auto">
      <div className="relative flex min-h-dvh w-full flex-col justify-end overflow-hidden px-6 pb-12 text-white sm:pb-24">
        <img
          src="/assets/home/home.webp"
          alt="Mobil Porsche"
          fetchPriority="high"
          className="absolute inset-0 z-0 size-full object-cover"
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent to-black/40" />

        <div className="relative z-20 mb-8 max-w-sm sm:mb-12">
          <h1 className="text-[30px] leading-tight font-semibold text-white">
            Insurance Claims
            <br />
            in Minutes
          </h1>
          <p className="mt-4 text-[16px] font-light text-white">
            AI technology that instantly analyzes
            <br />
            your car&apos;s damage
          </p>
        </div>

        <div className="relative z-40 w-full">
          <button
            type="button"
            onClick={handleStart}
            className="h-14 w-full rounded-lg bg-gradient-to-r from-[rgba(68,88,147,1)] to-[rgba(49,67,120,1)] text-lg font-semibold text-white shadow-[0_1px_4px_0_rgba(12,12,13,0.1)] transition-colors hover:opacity-90"
          >
            Start Now!
          </button>
        </div>
      </div>
    </main>
  );
}

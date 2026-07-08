import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/brand/Logo';
import { ROUTES } from '@/app/routes';
import { PageContainer } from './PageContainer';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <PageContainer className="bg-white">
      <div className="flex min-h-dvh flex-col items-center px-4 py-6">
        <Link to={ROUTES.home} className="mb-8">
          <Logo className="[&_img]:h-12" />
        </Link>

        <div className="mb-7">
          <img
            src="/assets/auth/icon-login.png"
            alt="Login Illustration"
            className="size-[200px] object-contain"
          />
        </div>

        <h1 className="text-deep-blue-500 text-center text-[22px] leading-tight font-semibold">
          {title}
        </h1>
        {subtitle && (
          <p className="my-4 text-center text-[14px] font-light text-gray-600">{subtitle}</p>
        )}

        <div className="w-full">{children}</div>
        {footer && <div className="mt-6 text-center text-sm text-gray-500">{footer}</div>}
      </div>
    </PageContainer>
  );
}

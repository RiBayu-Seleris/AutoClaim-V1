import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/app/routes';

// Compatibility route for old links. The complete claim flow now requires
// documents and voice chronology before reaching the detail page.
export function ClaimFormPage() {
  return <Navigate to={ROUTES.claimDocuments} replace />;
}

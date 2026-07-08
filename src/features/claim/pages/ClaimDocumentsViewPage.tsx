import { useNavigate } from 'react-router-dom';
import { FileImage } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/app/routes';
import { claimDocumentsList, useClaimDraftStore } from '../store/claimDraftStore';

export function ClaimDocumentsViewPage() {
  const navigate = useNavigate();
  const documents = claimDocumentsList(useClaimDraftStore((state) => state.documents));
  const engineNumber = useClaimDraftStore((state) => state.engineNumber);
  const engineNumberImageUrl = useClaimDraftStore((state) => state.engineNumberImageUrl);
  const chassisNumber = useClaimDraftStore((state) => state.chassisNumber);
  const chassisNumberImageUrl = useClaimDraftStore((state) => state.chassisNumberImageUrl);

  return (
    <PageContainer>
      <AppHeader title="Dokumen Klaim" />
      <div className="flex flex-1 flex-col gap-5 px-5 py-5">
        {documents.map((document) => (
          <figure key={document.documentType}>
            <figcaption className="text-14 mb-2 font-semibold text-neutral-900">
              {document.documentType}
            </figcaption>
            <div className="flex aspect-[1.58] items-center justify-center overflow-hidden rounded-lg border border-neutral-300 bg-neutral-100">
              {document.fileUrl ? (
                <img
                  src={document.fileUrl}
                  alt={document.documentType}
                  className="size-full object-contain"
                />
              ) : (
                <FileImage className="size-8 text-neutral-500" />
              )}
            </div>
          </figure>
        ))}
        <figure>
          <figcaption className="text-14 mb-2 font-semibold text-neutral-900">
            Nomor Mesin
          </figcaption>
          <div className="mb-2 flex aspect-[1.58] items-center justify-center overflow-hidden rounded-lg border border-neutral-300 bg-neutral-100">
            {engineNumberImageUrl ? (
              <img
                src={engineNumberImageUrl}
                alt="Nomor mesin"
                className="size-full object-contain"
              />
            ) : (
              <FileImage className="size-8 text-neutral-500" />
            )}
          </div>
          {engineNumber && <p className="text-13 font-semibold text-neutral-900">{engineNumber}</p>}
        </figure>
        <figure>
          <figcaption className="text-14 mb-2 font-semibold text-neutral-900">
            Nomor Rangka / VIN
          </figcaption>
          <div className="mb-2 flex aspect-[1.58] items-center justify-center overflow-hidden rounded-lg border border-neutral-300 bg-neutral-100">
            {chassisNumberImageUrl ? (
              <img
                src={chassisNumberImageUrl}
                alt="Nomor rangka/VIN"
                className="size-full object-contain"
              />
            ) : (
              <FileImage className="size-8 text-neutral-500" />
            )}
          </div>
          {chassisNumber && (
            <p className="text-13 font-semibold text-neutral-900">{chassisNumber}</p>
          )}
        </figure>
        <div className="mt-auto pt-4">
          <Button onClick={() => navigate(ROUTES.claimReview)}>Kembali ke Review</Button>
        </div>
      </div>
    </PageContainer>
  );
}

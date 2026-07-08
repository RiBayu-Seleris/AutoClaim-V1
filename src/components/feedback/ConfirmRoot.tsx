import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useConfirmStore } from './confirm';

/** Render tunggal di root app; menampilkan dialog saat `confirm()` dipanggil. */
export function ConfirmRoot() {
  const request = useConfirmStore((s) => s.request);
  const resolve = useConfirmStore((s) => s.resolve);

  return (
    <Modal
      open={Boolean(request)}
      onClose={() => {
        // Saat hideCancel, dialog wajib diakui — klik luar/escape tidak menutup.
        if (!request?.hideCancel) resolve(false);
      }}
      title={request?.title}
      showClose={false}
      footer={
        <div className="flex gap-3">
          {!request?.hideCancel && (
            <Button variant="outline" onClick={() => resolve(false)}>
              {request?.cancelText ?? 'Batal'}
            </Button>
          )}
          <Button
            variant={request?.tone === 'danger' ? 'danger' : 'primary'}
            onClick={() => resolve(true)}
          >
            {request?.confirmText ?? 'Ya'}
          </Button>
        </div>
      }
    >
      <p className="text-14 text-neutral-800">{request?.message}</p>
    </Modal>
  );
}

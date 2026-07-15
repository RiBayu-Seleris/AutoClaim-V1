import { Plus } from 'lucide-react';

/** Tombol aksi mengambang (tambah data) di kanan bawah, di atas bottom nav. */
export function MitraFab({ onClick, label = 'Tambah' }: { onClick: () => void; label?: string }) {
  return (
    <div className="pointer-events-none fixed bottom-24 left-1/2 z-40 w-full max-w-md -translate-x-1/2 px-5">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onClick}
          aria-label={label}
          className="bg-warning pointer-events-auto grid size-14 place-items-center rounded-full text-white shadow-[0_12px_24px_-8px_rgba(245,158,11,0.7)] transition active:scale-95"
        >
          <Plus className="size-7" />
        </button>
      </div>
    </div>
  );
}

import { useState, type ReactNode } from 'react';
import {
  alertClass, btnDanger, btnSecondary, dialogClass, errorMessage, useShowModal
} from './services/Adminui';

interface Props {
  title: string;
  children: ReactNode; // penjelasan akibat penghapusan
  confirmLabel: string;
  onConfirm: () => Promise<void>; // melempar error kalau gagal
  onClose: () => void;
}

export default function ConfirmDeleteDialog({ title, children, confirmLabel, onConfirm, onClose }: Props) {
  const dialogRef = useShowModal();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setError('');
    setDeleting(true);
    try {
      await onConfirm();
    } catch (err) {
      setError(errorMessage(err, 'Tidak dapat menghapus. Periksa koneksi internet, lalu coba lagi.'));
      setDeleting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={(e) => {
        if (deleting) e.preventDefault();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !deleting) onClose();
      }}
      aria-labelledby="confirm-title"
      aria-describedby="confirm-desc"
      className={`${dialogClass} max-w-[440px]`}
    >
      <div className="p-6">
        <h2 id="confirm-title" className="text-xl font-extrabold tracking-[-0.02em]">
          {title}
        </h2>
        <p id="confirm-desc" className="mt-2 text-base leading-normal text-[#5A6472]">
          {children}
        </p>

        {error && (
          <div role="alert" className={`mt-4 ${alertClass}`}>
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" autoFocus onClick={onClose} disabled={deleting} className={btnSecondary}>
            Batal
          </button>
          <button type="button" onClick={handleConfirm} disabled={deleting} className={btnDanger}>
            {deleting ? 'Menghapus…' : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
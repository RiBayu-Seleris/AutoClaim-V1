import { useCallback, useState } from 'react';
import { useScanServices } from '../services/scanServicesContext';
import { MAX_PLATE_ATTEMPTS } from '../services/types';
import { useScanStore } from '../store/scanStore';
import { normalizePlate, isValidPlate } from '../utils/plate';
import type { CapturedImage } from '../types';

/**
 * Mengelola OCR foto plat; bila GAGAL 3x → buka input manual.
 */
export function usePlateScan() {
  const services = useScanServices();
  const setPlateImage = useScanStore((s) => s.setPlateImage);
  const setPlate = useScanStore((s) => s.setPlate);

  const [attempts, setAttempts] = useState(0);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  /** Proses foto plat lewat OCR. Mengembalikan true bila plat terbaca jelas. */
  const recognizeFromImage = useCallback(
    async (image: CapturedImage): Promise<boolean> => {
      setPlateImage(image);
      setManualError(null);
      setIsRecognizing(true);
      try {
        const result = await services.plateRecognition.recognize(image.blob);
        if (result.detected && result.plateNumber) {
          const plate = normalizePlate(result.plateNumber);
          setPlate(plate, 'ocr');
          setAttempts(0);
          setShowManualInput(false);
          return true;
        }
        // Gagal terbaca → tambah hitungan; setelah batas, buka input manual.
        setAttempts((prev) => {
          const next = prev + 1;
          if (next >= MAX_PLATE_ATTEMPTS) setShowManualInput(true);
          return next;
        });
        return false;
      } catch {
        setAttempts((prev) => {
          const next = prev + 1;
          if (next >= MAX_PLATE_ATTEMPTS) setShowManualInput(true);
          return next;
        });
        return false;
      } finally {
        setIsRecognizing(false);
      }
    },
    [services, setPlate, setPlateImage],
  );

  /** Konfirmasi plat yang diketik manual. Mengembalikan true bila valid. */
  const confirmManualPlate = useCallback(
    (raw: string): boolean => {
      const plate = normalizePlate(raw);
      if (!isValidPlate(plate)) {
        setManualError('Format plat tidak valid. Contoh: B 1234 ABC');
        return false;
      }
      setManualError(null);
      setPlate(plate, 'manual');
      return true;
    },
    [setPlate],
  );

  const enableManualInput = useCallback(() => setShowManualInput(true), []);

  return {
    attempts,
    maxAttempts: MAX_PLATE_ATTEMPTS,
    isRecognizing,
    showManualInput,
    manualError,
    recognizeFromImage,
    confirmManualPlate,
    enableManualInput,
  };
}

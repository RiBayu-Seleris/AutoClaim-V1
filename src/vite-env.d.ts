/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_AUTOCLAIM_BASE_URL: string;
  readonly VITE_API_CHANNEL: string;
  readonly VITE_USE_MOCK_SERVICES: string;
  readonly VITE_USE_MOCK_SCAN_SERVICES?: string;
  readonly VITE_USE_MOCK_DAMAGE_ANALYSIS?: string;
  readonly VITE_USE_MOCK_INSURANCE_CHECK?: string;
  readonly VITE_SELERIS_UPLOAD_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

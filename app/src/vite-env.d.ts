/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SCORE_API_HOST?: string;
  readonly VITE_SCORE_DATE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

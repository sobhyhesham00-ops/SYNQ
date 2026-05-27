declare global {
  interface ImportMetaEnv {
    readonly VITE_APP_URL: string;
    // more env variables...
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export {};

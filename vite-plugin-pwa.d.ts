declare module 'vite-plugin-pwa' {
  import { Plugin } from 'vite';
  export interface VitePWAMoptions {
    registerType?: 'autoUpdate' | 'prompt';
    includeAssets?: string[];
    manifest?: any;
    workbox?: any;
    devOptions?: {
      enabled?: boolean;
      type?: 'classic' | 'module';
    };
  }
  export function VitePWA(options?: VitePWAMoptions): Plugin[];
}

declare module 'virtual:pwa-register' {
  export interface RegisterSWOptions {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
    onRegisterError?: (error: any) => void;
  }

  export function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => Promise<void>;
}

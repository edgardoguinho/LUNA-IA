import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Ensure Service Worker is registered immediately and updates automatically on mobile PWA
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[Luna AI] Nova versão detectada! Atualizando cache do app instalado...');
    updateSW(true);
  },
  onOfflineReady() {
    console.log('[Luna AI] Aplicativo pronto para uso offline.');
  },
});

// Periodic check for SW update and whenever the PWA is brought to the foreground on mobile
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      navigator.serviceWorker.ready
        .then((reg) => {
          reg.update().catch(() => {});
        })
        .catch(() => {});
    }
  });
}

createRoot(document.getElementById('root')!).render(<App />);

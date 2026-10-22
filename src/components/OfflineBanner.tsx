import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="bg-rose-900/90 border-b border-rose-500/50 text-rose-100 px-4 py-2 text-xs flex items-center justify-center gap-2 backdrop-blur-sm shadow-md animate-pulse z-40">
      <WifiOff className="w-4 h-4 text-rose-300 shrink-0" />
      <span>Você está sem conexão com a internet. O histórico salvo continua disponível offline.</span>
    </div>
  );
};

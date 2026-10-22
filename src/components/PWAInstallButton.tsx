import React, { useState } from 'react';
import { Download, Share2, X, Smartphone, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface Props {
  variant?: 'compact' | 'full';
}

export const PWAInstallButton: React.FC<Props> = ({ variant = 'compact' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      setJustInstalled(true);
      setTimeout(() => setJustInstalled(false), 4000);
    }
  };

  if (isInstallable) {
    return (
      <>
        <button
          onClick={handleInstall}
          title="Instalar Luna AI na Tela Inicial do seu celular"
          className={
            variant === 'full'
              ? 'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-medium text-sm shadow-lg shadow-pink-500/20 active:scale-95 transition'
              : 'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-pink-500/20 border border-pink-500/40 hover:bg-pink-500/30 text-pink-300 hover:text-white text-xs font-medium transition active:scale-95'
          }
        >
          {justInstalled ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Instalado!</span>
            </>
          ) : (
            <>
              <Smartphone className="w-3.5 h-3.5 text-pink-400" />
              <span>Instalar App</span>
            </>
          )}
        </button>
      </>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          title="Instalar no iPhone / iPad"
          className={
            variant === 'full'
              ? 'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-pink-500/20 border border-pink-500/40 text-pink-200 text-sm font-medium hover:bg-pink-500/30 transition'
              : 'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-pink-500/20 border border-pink-500/40 hover:bg-pink-500/30 text-pink-300 text-xs font-medium transition'
          }
        >
          <Download className="w-3.5 h-3.5 text-pink-400" />
          <span>Instalar no iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-gradient-to-b from-[#1f0f33] to-[#120722] border border-pink-500/30 p-6 shadow-2xl text-purple-100 relative">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 text-purple-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-12 h-12 rounded-2xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center mb-4 text-pink-400">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Instalar Luna no iPhone / iPad</h3>
              <p className="text-sm text-purple-300/90 leading-relaxed mb-4">
                Para ter o ícone da Luna AI na sua tela de início:
              </p>
              <ol className="text-xs text-purple-200 space-y-2.5 mb-5 bg-purple-950/50 p-3.5 rounded-xl border border-purple-800/40">
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-pink-600/50 text-white flex items-center justify-center text-[10px] font-bold">1</span>
                  <span>Toque no botão <Share2 className="w-3.5 h-3.5 inline mx-1 text-pink-400" /> <strong>Compartilhar</strong> no Safari.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-pink-600/50 text-white flex items-center justify-center text-[10px] font-bold">2</span>
                  <span>Role para baixo e selecione <strong>Adicionar à Tela de Início</strong>.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-pink-600/50 text-white flex items-center justify-center text-[10px] font-bold">3</span>
                  <span>Toque em <strong>Adicionar</strong> no canto superior direito.</span>
                </li>
              </ol>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-medium text-sm transition"
              >
                Entendi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

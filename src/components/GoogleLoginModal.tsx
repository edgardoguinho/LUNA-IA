import React, { useState, useEffect, useRef } from 'react';
import { X, ShieldCheck, AlertCircle, Copy, Check, Sparkles, Loader2, ExternalLink } from 'lucide-react';
import { UserAccount } from '../types';

interface GoogleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onLoginSuccess: (user: UserAccount, token?: string) => void;
}

export const GoogleLoginModal: React.FC<GoogleLoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
}) => {
  const [config, setConfig] = useState<{
    configured: boolean;
    googleClientId: string | null;
    instructions: string;
    allowedOrigins?: string[];
  }>({
    configured: false,
    googleClientId: null,
    instructions: '',
  });
  const [customClientId, setCustomClientId] = useState('');
  const [savingClientId, setSavingClientId] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedOrigin, setCopiedOrigin] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const tokenClientRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    try {
      const res = await fetch('/api/auth/google-config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        if (data.googleClientId) {
          setCustomClientId(data.googleClientId);
        }
        if (data.configured && data.googleClientId) {
          initializeGoogleServices(data.googleClientId);
        }
      }
    } catch (err) {
      console.warn('Falha ao obter status do Google OAuth:', err);
    }
  };

  const initializeGoogleServices = (clientId: string) => {
    const google = (window as any).google;
    if (!google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => setupGSI(clientId);
      document.head.appendChild(script);
    } else {
      setupGSI(clientId);
    }
  };

  const setupGSI = (clientId: string) => {
    try {
      const google = (window as any).google;
      if (!google) return;

      if (google.accounts?.id) {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        const btnContainer = document.getElementById('google-signin-btn-container');
        if (btnContainer) {
          btnContainer.innerHTML = '';
          google.accounts.id.renderButton(btnContainer, {
            theme: 'filled_black',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            locale: 'pt-BR',
          });
        }
      }

      if (google.accounts?.oauth2) {
        tokenClientRef.current = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'openid email profile',
          prompt: 'select_account',
          callback: handleGoogleTokenResponse,
          error_callback: (err: any) => {
            console.warn('[Luna Auth] Erro no popup do Google:', err);
            if (err?.type !== 'popup_closed') {
              setErrorMsg('A janela de autenticação Google foi cancelada ou fechada antes da confirmação.');
            }
          },
        });
      }
    } catch (err) {
      console.warn('Erro ao inicializar botão Google Identity:', err);
    }
  };

  const handleGoogleLoginClick = () => {
    if (!config.configured || !config.googleClientId) return;
    setErrorMsg(null);
    if (tokenClientRef.current) {
      try {
        tokenClientRef.current.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        console.warn('Erro ao invocar tokenClient:', err);
      }
    }
    const google = (window as any).google;
    if (google?.accounts?.id) {
      google.accounts.id.prompt();
    }
  };

  const handleGoogleTokenResponse = async (tokenResponse: any) => {
    if (!tokenResponse?.access_token) {
      if (tokenResponse?.error !== 'popup_closed_by_user') {
        setErrorMsg(tokenResponse?.error_description || 'Falha ao autenticar com Google.');
      }
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: tokenResponse.access_token }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Falha ao autenticar com Google.');
      }
      if (data.token) {
        localStorage.setItem('luna_session_token_v1', data.token);
      }
      onLoginSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao processar login Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredentialResponse = async (response: any) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Falha ao autenticar com Google.');
      }

      const data = await res.json();
      if (data.user) {
        if (data.token) {
          localStorage.setItem('luna_session_token_v1', data.token);
        }
        onLoginSuccess(data.user, data.token);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao processar login Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClientId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customClientId.trim()) {
      setErrorMsg('Cole seu Google Client ID.');
      return;
    }
    setSavingClientId(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/google-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: customClientId.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Falha ao salvar Client ID.');
      }
      setConfig({
        ...config,
        configured: true,
        googleClientId: data.googleClientId,
      });
      initializeGoogleServices(data.googleClientId);
      setSuccessMsg('Google Client ID configurado com sucesso!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar Client ID.');
    } finally {
      setSavingClientId(false);
    }
  };

  const handleCopyOrigin = (url: string) => {
    navigator.clipboard?.writeText(url);
    setCopiedOrigin(url);
    setTimeout(() => setCopiedOrigin(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-[#161616] border border-neutral-700 p-6 shadow-2xl text-zinc-100 relative my-auto max-h-[90vh] overflow-y-auto animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-zinc-900 border border-zinc-700 p-2 flex items-center justify-center shadow">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Login com Conta Google</h2>
            <p className="text-xs text-zinc-400">Autenticação oficial segura com seletor de contas</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200">
            {successMsg}
          </div>
        )}

        {config.configured ? (
          <div className="space-y-4">
            <p className="text-xs text-zinc-300">
              Toque no botão abaixo para escolher qual conta Google deseja utilizar:
            </p>
            <button
              type="button"
              onClick={handleGoogleLoginClick}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-sm font-semibold bg-white text-black hover:bg-neutral-200 transition cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Escolher Conta Google</span>
            </button>
            <div id="google-signin-btn-container" className="flex justify-center my-2 min-h-[44px]" />
            {loading && <p className="text-xs text-blue-400 text-center animate-pulse">Autenticando sessão...</p>}
          </div>
        ) : (
          <div className="space-y-3.5">
            <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 space-y-2.5">
              <div className="flex items-center gap-2 text-blue-400 font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Configuração de Credenciais Google</span>
              </div>
              <p className="text-[11.5px] text-zinc-400 leading-relaxed">
                Adicione a origem da Luna AI nas credenciais OAuth do Google Cloud:
              </p>
              <div className="space-y-1.5 font-mono text-[11px]">
                {[
                  'https://luna-ai-2.ai.studio',
                  typeof window !== 'undefined' ? window.location.origin : '',
                ]
                  .filter(Boolean)
                  .filter((v, i, a) => a.indexOf(v) === i)
                  .map((origin) => (
                    <div
                      key={origin}
                      className="flex items-center justify-between p-2 rounded bg-black/60 border border-zinc-800"
                    >
                      <span className="truncate mr-2 text-zinc-300">{origin}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyOrigin(origin)}
                        className="p-1 text-zinc-400 hover:text-white"
                        title="Copiar"
                      >
                        {copiedOrigin === origin ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
              </div>

              {/* Input to set Client ID right here */}
              <form onSubmit={handleSaveClientId} className="space-y-2 pt-2">
                <label className="block text-[11px] font-semibold text-zinc-300">
                  Cole seu Google Client ID para ativar imediatamente:
                </label>
                <input
                  type="text"
                  value={customClientId}
                  onChange={(e) => setCustomClientId(e.target.value)}
                  placeholder="ex: 123456...apps.googleusercontent.com"
                  className="w-full p-2.5 rounded-lg bg-black/70 border border-zinc-700 text-xs text-white font-mono placeholder-zinc-500 outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={savingClientId}
                  className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {savingClientId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Salvar e Ativar Google Sign-In</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

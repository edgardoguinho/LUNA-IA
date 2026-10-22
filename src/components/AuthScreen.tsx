import React, { useState, useEffect, useRef } from 'react';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  KeyRound,
  Loader2,
  Sparkles,
  HelpCircle,
  X,
  ExternalLink,
  Sun,
  Moon,
  Copy,
  Check,
} from 'lucide-react';
import { UserAccount } from '../types';

interface AuthScreenProps {
  onAuthSuccess: (user: UserAccount, token: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onAuthSuccess,
  theme,
  onToggleTheme,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [recoveryCodeReceived, setRecoveryCodeReceived] = useState<string | null>(null);
  const [showGoogleGuideModal, setShowGoogleGuideModal] = useState(false);

  const [customClientIdInput, setCustomClientIdInput] = useState('');
  const [savingClientId, setSavingClientId] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const tokenClientRef = useRef<any>(null);

  const [googleConfig, setGoogleConfig] = useState<{
    configured: boolean;
    googleClientId: string | null;
    appUrl?: string;
    allowedOrigins?: string[];
  }>({
    configured: false,
    googleClientId: null,
  });

  useEffect(() => {
    fetchGoogleConfig();
  }, []);

  const fetchGoogleConfig = async () => {
    try {
      const res = await fetch('/api/auth/google-config');
      if (res.ok) {
        const data = await res.json();
        const isConfigured = Boolean(data.configured && data.googleClientId);
        setGoogleConfig({
          configured: isConfigured,
          googleClientId: data.googleClientId,
          appUrl: data.appUrl,
          allowedOrigins: data.allowedOrigins,
        });
        if (data.googleClientId) {
          setCustomClientIdInput(data.googleClientId);
        }
        if (isConfigured && data.googleClientId) {
          initGoogleServices(data.googleClientId);
        }
      }
    } catch (e) {
      console.warn('[Luna Auth] Erro ao carregar configuração do Google:', e);
    }
  };

  const initGoogleServices = (clientId: string) => {
    const google = (window as any).google;
    if (!google) {
      const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
      if (!existing) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => setupGSI(clientId);
        document.head.appendChild(script);
      } else {
        const interval = setInterval(() => {
          if ((window as any).google) {
            clearInterval(interval);
            setupGSI(clientId);
          }
        }, 150);
        setTimeout(() => clearInterval(interval), 5000);
      }
    } else {
      setupGSI(clientId);
    }
  };

  const setupGSI = (clientId: string) => {
    try {
      const google = (window as any).google;
      if (!google) return;

      // 1. Initialize google.accounts.id for ID tokens and One Tap
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
            theme: theme === 'dark' ? 'filled_black' : 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            width: 360,
            locale: 'pt-BR',
          });
        }
      }

      // 2. Initialize OAuth2 Token Client with 'select_account' prompt (Official Account Chooser!)
      if (google.accounts?.oauth2) {
        tokenClientRef.current = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'openid email profile',
          prompt: 'select_account',
          callback: handleGoogleTokenResponse,
          error_callback: (err: any) => {
            console.warn('[Luna Auth] Notificação de erro no popup do Google:', err);
            if (err?.type !== 'popup_closed') {
              setErrorMsg('A janela de autenticação Google foi cancelada ou fechada antes da confirmação.');
            }
          },
        });
      }
    } catch (err) {
      console.warn('[Luna Auth] Erro ao inicializar serviços Google:', err);
    }
  };

  const handleGoogleLoginClick = () => {
    if (!googleConfig.configured || !googleConfig.googleClientId) {
      setShowGoogleGuideModal(true);
      return;
    }

    setErrorMsg(null);

    // Prefer tokenClient with prompt: 'select_account' (opens official Google account picker with all accounts + "Usar outra conta")
    if (tokenClientRef.current) {
      try {
        tokenClientRef.current.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        console.warn('[Luna Auth] Erro ao invocar requestAccessToken:', err);
      }
    }

    // Fallback: prompt google.accounts.id
    const google = (window as any).google;
    if (google?.accounts?.id) {
      google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed()) {
          console.warn('[Luna Auth] Google One Tap not displayed:', notification.getNotDisplayedReason?.());
        }
      });
    } else {
      setShowGoogleGuideModal(true);
    }
  };

  const handleGoogleTokenResponse = async (tokenResponse: any) => {
    if (!tokenResponse || tokenResponse.error) {
      if (tokenResponse?.error === 'popup_closed_by_user') {
        return;
      }
      setErrorMsg(tokenResponse?.error_description || 'Falha ao autenticar com Google.');
      return;
    }

    if (!tokenResponse.access_token) {
      setErrorMsg('Token de acesso do Google não retornado.');
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

      onAuthSuccess(data.user, data.token);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao conectar com conta Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredentialResponse = async (response: any) => {
    if (!response?.credential) {
      setErrorMsg('Falha ao obter credencial do Google. Tente novamente.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Falha ao autenticar com Google.');
      }

      onAuthSuccess(data.user, data.token);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao conectar com conta Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGoogleClientId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customClientIdInput.trim()) {
      setErrorMsg('Informe um Google Client ID válido.');
      return;
    }
    setSavingClientId(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/google-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: customClientIdInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Falha ao salvar Client ID.');
      }
      setGoogleConfig({
        configured: true,
        googleClientId: data.googleClientId,
      });
      initGoogleServices(data.googleClientId);
      setShowGoogleGuideModal(false);
      setSuccessMsg('Google Sign-In ativado com sucesso! Toque em "Continuar com Google" para escolher sua conta.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar Client ID.');
    } finally {
      setSavingClientId(false);
    }
  };

  const copyToClipboard = (text: string) => {
    try {
      navigator.clipboard?.writeText(text);
      setCopiedUrl(text);
      setTimeout(() => setCopiedUrl(null), 2500);
    } catch (e) {
      console.warn('Clipboard não acessível:', e);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Preencha seu e-mail e senha.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Credenciais inválidas. Verifique seu e-mail e senha.');
      }

      onAuthSuccess(data.user, data.token);
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Preencha e-mail e senha.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          displayName: displayName.trim() || email.split('@')[0],
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Não foi possível concluir o cadastro.');
      }

      onAuthSuccess(data.user, data.token);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro no cadastro.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Informe seu e-mail cadastrado.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao solicitar código.');
      }

      setSuccessMsg('Código de recuperação de 6 dígitos gerado com sucesso.');
      if (data.recoveryCode) {
        setRecoveryCodeReceived(data.recoveryCode);
        setRecoveryCode(data.recoveryCode);
      }
      setMode('reset');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao solicitar recuperação.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !recoveryCode.trim() || !newPassword) {
      setErrorMsg('Preencha todos os campos para redefinir sua senha.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          recoveryCode: recoveryCode.trim(),
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Falha ao redefinir senha.');
      }

      setSuccessMsg('Sua senha foi redefinida com sucesso! Faça login com a nova senha.');
      setPassword(newPassword);
      setMode('login');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao redefinir senha.');
    } finally {
      setLoading(false);
    }
  };

  const fillEdgarCreator = () => {
    setEmail('edgargames771@gmail.com');
    setPassword('edgar123');
    setErrorMsg(null);
  };

  const isDark = theme === 'dark';

  return (
    <div
      className={`min-h-screen w-full flex flex-col justify-between items-center px-4 py-8 transition-colors duration-200 ${
        isDark ? 'bg-[#0d0d0d] text-[#ececec]' : 'bg-white text-[#0d0d0d]'
      }`}
    >
      {/* Top Bar: Theme Switcher & Status */}
      <div className="w-full max-w-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-neutral-800 dark:bg-neutral-800 flex items-center justify-center text-sm shadow-sm border border-neutral-700/60">
            🌙
          </div>
          <span className="font-semibold text-sm tracking-tight">Luna AI</span>
        </div>

        <button
          onClick={onToggleTheme}
          title={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          className={`p-2 rounded-lg transition-colors border ${
            isDark
              ? 'border-neutral-800 hover:bg-neutral-800 text-neutral-300'
              : 'border-neutral-200 hover:bg-neutral-100 text-neutral-700'
          }`}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Centered Auth Box */}
      <div className="w-full max-w-[390px] my-auto">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-md mb-4">
            <span className="text-2xl select-none">🌙</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === 'login' && 'Entrar na sua conta'}
            {mode === 'register' && 'Criar sua conta'}
            {mode === 'forgot' && 'Recuperar senha'}
            {mode === 'reset' && 'Definir nova senha'}
          </h1>
          <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
            {mode === 'login' && 'Boas-vindas de volta. Entre para continuar suas conversas.'}
            {mode === 'register' && 'Cadastre-se para ter sua assistente com memória e contexto.'}
            {mode === 'forgot' && 'Digite seu e-mail para receber um código de 6 dígitos.'}
            {mode === 'reset' && 'Digite o código de verificação recebido e sua nova senha.'}
          </p>
        </div>

        {/* Error Notice */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-snug">{errorMsg}</div>
          </div>
        )}

        {/* Success Notice */}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-200 text-xs flex items-start gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-snug">{successMsg}</div>
          </div>
        )}

        {/* Development Code Helper (If Generated) */}
        {recoveryCodeReceived && mode === 'reset' && (
          <div className="mb-4 p-3 rounded-xl bg-amber-950/40 border border-amber-700/60 text-amber-200 text-xs">
            <div className="font-semibold mb-1 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" /> Código de Verificação Gerado:
            </div>
            <div className="font-mono text-base font-bold text-amber-100 tracking-widest bg-black/40 px-3 py-1.5 rounded-lg text-center my-1.5 border border-amber-600/40">
              {recoveryCodeReceived}
            </div>
            <p className="text-[11px] text-amber-300/80">
              Código preenchido automaticamente para facilitar seu teste.
            </p>
          </div>
        )}

        {/* Google Continue Button (Available for Login and Register) */}
        {(mode === 'login' || mode === 'register') && (
          <div className="mb-5 space-y-2.5">
            <button
              type="button"
              onClick={handleGoogleLoginClick}
              disabled={loading}
              className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-sm font-medium border transition-colors cursor-pointer select-none active:scale-[0.99] ${
                isDark
                  ? 'bg-[#181818] hover:bg-[#222222] border-neutral-700 text-white'
                  : 'bg-white hover:bg-neutral-50 border-neutral-300 text-neutral-800 shadow-sm'
              }`}
            >
              {/* Official Google G Logo SVG */}
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
              <span>Continuar com Google</span>
            </button>

            {/* Container for rendered official Google Identity Services button if available */}
            {googleConfig.configured && (
              <div id="google-signin-btn-container" className="flex justify-center w-full min-h-[44px]" />
            )}

            {/* Divider */}
            <div className="flex items-center my-4">
              <div className={`flex-1 border-t ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`} />
              <span className="px-3 text-xs text-neutral-500 font-medium">ou</span>
              <div className={`flex-1 border-t ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`} />
            </div>
          </div>
        )}

        {/* Forms */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                Endereço de e-mail ou usuário
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@exemplo.com"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border transition-colors outline-none ${
                    isDark
                      ? 'bg-[#181818] border-neutral-700/80 text-white placeholder-neutral-500 focus:border-neutral-400'
                      : 'bg-white border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-neutral-600'
                  }`}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-neutral-400">Senha</label>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setSuccessMsg(null);
                    setMode('forgot');
                  }}
                  className="text-xs text-emerald-500 hover:text-emerald-400 transition"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full px-3.5 py-2.5 pr-10 rounded-xl text-sm border transition-colors outline-none ${
                    isDark
                      ? 'bg-[#181818] border-neutral-700/80 text-white placeholder-neutral-500 focus:border-neutral-400'
                      : 'bg-white border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-neutral-600'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer mt-4 ${
                isDark
                  ? 'bg-white text-black hover:bg-neutral-200 disabled:bg-neutral-600'
                  : 'bg-[#0d0d0d] text-white hover:bg-neutral-800 disabled:bg-neutral-400'
              }`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continuar'}
            </button>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                Seu nome ou apelido
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Como a Luna deve te chamar?"
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm border transition-colors outline-none ${
                  isDark
                    ? 'bg-[#181818] border-neutral-700/80 text-white placeholder-neutral-500 focus:border-neutral-400'
                    : 'bg-white border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-neutral-600'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                Endereço de e-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@exemplo.com"
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm border transition-colors outline-none ${
                  isDark
                    ? 'bg-[#181818] border-neutral-700/80 text-white placeholder-neutral-500 focus:border-neutral-400'
                    : 'bg-white border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-neutral-600'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                Crie uma senha (mínimo 6 caracteres)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full px-3.5 py-2.5 pr-10 rounded-xl text-sm border transition-colors outline-none ${
                    isDark
                      ? 'bg-[#181818] border-neutral-700/80 text-white placeholder-neutral-500 focus:border-neutral-400'
                      : 'bg-white border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-neutral-600'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer mt-4 ${
                isDark
                  ? 'bg-white text-black hover:bg-neutral-200 disabled:bg-neutral-600'
                  : 'bg-[#0d0d0d] text-white hover:bg-neutral-800 disabled:bg-neutral-400'
              }`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar conta'}
            </button>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleRequestRecovery} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                E-mail cadastrado na Luna AI
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@exemplo.com"
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm border transition-colors outline-none ${
                  isDark
                    ? 'bg-[#181818] border-neutral-700/80 text-white placeholder-neutral-500 focus:border-neutral-400'
                    : 'bg-white border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-neutral-600'
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer mt-4 ${
                isDark
                  ? 'bg-white text-black hover:bg-neutral-200 disabled:bg-neutral-600'
                  : 'bg-[#0d0d0d] text-white hover:bg-neutral-800 disabled:bg-neutral-400'
              }`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gerar código de recuperação'}
            </button>

            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setSuccessMsg(null);
                setMode('login');
              }}
              className="w-full text-center text-xs text-neutral-400 hover:text-white mt-2 flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar para o login
            </button>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                Código de verificação (6 dígitos)
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
                placeholder="123456"
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm text-center font-mono tracking-widest border transition-colors outline-none ${
                  isDark
                    ? 'bg-[#181818] border-neutral-700/80 text-white placeholder-neutral-500 focus:border-neutral-400'
                    : 'bg-white border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-neutral-600'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                Nova senha (mínimo 6 caracteres)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full px-3.5 py-2.5 pr-10 rounded-xl text-sm border transition-colors outline-none ${
                    isDark
                      ? 'bg-[#181818] border-neutral-700/80 text-white placeholder-neutral-500 focus:border-neutral-400'
                      : 'bg-white border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-neutral-600'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer mt-4 ${
                isDark
                  ? 'bg-white text-black hover:bg-neutral-200 disabled:bg-neutral-600'
                  : 'bg-[#0d0d0d] text-white hover:bg-neutral-800 disabled:bg-neutral-400'
              }`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar nova senha'}
            </button>

            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setSuccessMsg(null);
                setMode('login');
              }}
              className="w-full text-center text-xs text-neutral-400 hover:text-white mt-2 flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar para o login
            </button>
          </form>
        )}

        {/* Bottom Toggle: Switch between Login & Register */}
        <div className="mt-6 pt-5 text-center text-xs text-neutral-400 border-t border-neutral-800/80">
          {mode === 'login' ? (
            <p>
              Não tem uma conta?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  setMode('register');
                }}
                className="text-white hover:underline font-semibold"
              >
                Cadastre-se
              </button>
            </p>
          ) : mode === 'register' ? (
            <p>
              Já tem uma conta?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  setMode('login');
                }}
                className="text-white hover:underline font-semibold"
              >
                Entrar
              </button>
            </p>
          ) : null}
        </div>

        {/* Quick Creator fill button (Edgar) */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={fillEdgarCreator}
            className="text-[11px] text-neutral-500 hover:text-neutral-300 underline decoration-dotted transition"
          >
            Preencher conta do Criador Edgar (edgargames771@gmail.com)
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-[11px] text-neutral-500 mt-6">
        Luna AI • Privada, segura e com memórias associadas à sua conta.
      </div>

      {/* Modal: Instruções Claras e Ativação do Google Login no Android / PC */}
      {showGoogleGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-lg bg-[#181818] border border-neutral-700 rounded-2xl p-6 text-neutral-200 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowGoogleGuideModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                <h3 className="font-semibold text-white text-base">Ativação do Google Sign-In</h3>
                <p className="text-xs text-neutral-400">Passo a passo rápido para Android ou Computador</p>
              </div>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-neutral-300">
              <p>
                O backend e o frontend da Luna já estão <strong>100% integrados</strong> com o Google Identity Services oficial (incluindo o seletor de contas). Para o Google autorizar o pop-up no seu domínio:
              </p>

              {/* Step 1 */}
              <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-white">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold text-[10px]">
                    1
                  </span>
                  <span>Acesse o Google Cloud Console (gratuito)</span>
                </div>
                <p className="text-neutral-400 text-[11.5px]">
                  Abra a aba de Credenciais no seu celular ou PC:{' '}
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline font-medium inline-flex items-center gap-1"
                  >
                    console.cloud.google.com/apis/credentials <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2.5">
                <div className="flex items-center gap-2 font-semibold text-white">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold text-[10px]">
                    2
                  </span>
                  <span>Criar Credencial &gt; ID do cliente OAuth</span>
                </div>
                <p className="text-neutral-400 text-[11.5px]">
                  Selecione tipo <strong>Aplicativo da Web</strong> e adicione em <em>Origens JavaScript autorizadas</em>:
                </p>

                <div className="space-y-1.5 font-mono text-[11px]">
                  {[
                    'https://luna-ai-2.ai.studio',
                    'https://ais-pre-4swycqsgsoopm6oetj2egc-884986752296.us-east1.run.app',
                    'https://ais-dev-4swycqsgsoopm6oetj2egc-884986752296.us-east1.run.app',
                  ].map((originUrl) => (
                    <div
                      key={originUrl}
                      className="flex items-center justify-between p-2 rounded-lg bg-black/50 border border-neutral-800 text-neutral-300"
                    >
                      <span className="truncate mr-2">{originUrl}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(originUrl)}
                        className="shrink-0 p-1 hover:text-white text-neutral-400 transition"
                        title="Copiar domínio"
                      >
                        {copiedUrl === originUrl ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 3: Interactive input right here! */}
              <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-800/40 space-y-2.5">
                <div className="flex items-center gap-2 font-semibold text-blue-200">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold text-[10px]">
                    3
                  </span>
                  <span>Cole seu Google Client ID para ativar imediatamente</span>
                </div>
                <p className="text-[11.5px] text-blue-300/80">
                  O Client ID é um valor público (ex: <code>123456789-abc.apps.googleusercontent.com</code>). Você pode colar aqui e ativar na hora sem reiniciar:
                </p>

                <form onSubmit={handleSaveGoogleClientId} className="space-y-2 mt-1">
                  <input
                    type="text"
                    value={customClientIdInput}
                    onChange={(e) => setCustomClientIdInput(e.target.value)}
                    placeholder="ex: 1234567890-abcdefg.apps.googleusercontent.com"
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-blue-700/50 text-white text-xs font-mono placeholder-neutral-500 outline-none focus:border-blue-400"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={savingClientId}
                      className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {savingClientId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      <span>Salvar e Ativar Google Sign-In</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Reassurance */}
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-[11.5px]">
                ✨ <strong>Alternativa Imediata:</strong> Você também pode entrar ou se cadastrar com <strong>E-mail e Senha</strong> logo abaixo! Todas as conversas, memórias e preferências funcionam perfeitamente e sem custo.
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowGoogleGuideModal(false)}
                className="w-full py-2.5 rounded-xl bg-white text-black hover:bg-neutral-200 text-xs font-semibold transition"
              >
                Voltar e Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

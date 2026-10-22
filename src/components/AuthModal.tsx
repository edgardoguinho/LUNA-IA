import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  Check,
  AlertCircle,
  ArrowLeft,
  KeyRound,
  Loader2,
  ShieldCheck,
  Copy,
} from 'lucide-react';
import { UserAccount } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserAccount, token: string) => void;
  currentUser?: UserAccount;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  currentUser,
}) => {
  const [tab, setTab] = useState<'login' | 'register' | 'forgot_password' | 'reset_password'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [recoveryCodeNotice, setRecoveryCodeNotice] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const [googleConfig, setGoogleConfig] = useState<{ configured: boolean; googleClientId: string | null }>({
    configured: false,
    googleClientId: null,
  });

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSuccessMsg(null);
      fetchGoogleConfig();
    }
  }, [isOpen]);

  const fetchGoogleConfig = async () => {
    try {
      const res = await fetch('/api/auth/google-config');
      if (res.ok) {
        const data = await res.json();
        setGoogleConfig({
          configured: Boolean(data.configured && data.googleClientId),
          googleClientId: data.googleClientId,
        });
        if (data.configured && data.googleClientId) {
          initializeGoogleGSI(data.googleClientId);
        }
      }
    } catch (e) {
      console.warn('[Luna Auth] Não foi possível carregar config Google:', e);
    }
  };

  const initializeGoogleGSI = (clientId: string) => {
    if (!(window as any).google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => renderGSIButton(clientId);
      document.head.appendChild(script);
    } else {
      renderGSIButton(clientId);
    }
  };

  const renderGSIButton = (clientId: string) => {
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

        const btnContainer = document.getElementById('google-auth-btn-slot');
        if (btnContainer) {
          btnContainer.innerHTML = '';
          google.accounts.id.renderButton(btnContainer, {
            theme: 'filled_black',
            size: 'large',
            text: 'continue_with',
            shape: 'pill',
            locale: 'pt-BR',
            width: 280,
          });
        }
      }
    } catch (err) {
      console.warn('[Luna Auth] Erro ao renderizar botão Google:', err);
    }
  };

  const handleGoogleCredentialResponse = async (response: any) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          response.access_token
            ? { accessToken: response.access_token }
            : { credential: response.credential }
        ),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Falha ao autenticar com conta Google.');
      }

      if (data.token) {
        localStorage.setItem('luna_session_token_v1', data.token);
      }
      onAuthSuccess(data.user, data.token || '');
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Falha na autenticação Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg('Informe um e-mail válido.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password,
          displayName: displayName.trim() || cleanEmail.split('@')[0],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Não foi possível criar sua conta.');
      }

      if (data.token) {
        localStorage.setItem('luna_session_token_v1', data.token);
      }
      setSuccessMsg(data.message || 'Conta criada com sucesso! 💕');
      setTimeout(() => {
        onAuthSuccess(data.user, data.token || '');
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao realizar cadastro.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg('Informe seu e-mail ou nome de usuário.');
      return;
    }
    if (!password) {
      setErrorMsg('Informe sua senha.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: cleanEmail,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'E-mail ou senha incorretos.');
      }

      if (data.token) {
        localStorage.setItem('luna_session_token_v1', data.token);
      }
      setSuccessMsg(data.message || 'Login realizado com sucesso! 💕');
      setTimeout(() => {
        onAuthSuccess(data.user, data.token || '');
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Falha ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setRecoveryCodeNotice(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg('Informe o e-mail da sua conta para recuperação.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao solicitar código de recuperação.');
      }

      if (data.recoveryCode) {
        setRecoveryCodeNotice(data.recoveryCode);
        setRecoveryCode(data.recoveryCode);
      }
      setSuccessMsg('Código de recuperação gerado! Digite-o abaixo junto com a sua nova senha.');
      setTab('reset_password');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Falha ao recuperar senha.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();
    const cleanCode = recoveryCode.trim();
    if (!cleanEmail || !cleanCode) {
      setErrorMsg('Preencha o e-mail e o código de recuperação de 6 dígitos.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          recoveryCode: cleanCode,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao redefinir senha.');
      }

      setSuccessMsg('Senha redefinida com sucesso! Você já pode entrar.');
      setPassword(newPassword);
      setTab('login');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao redefinir senha.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-3xl bg-[#130722] border border-pink-500/30 p-6 sm:p-7 shadow-2xl text-purple-100 relative my-auto animate-fadeIn">
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-4 right-4 text-purple-400 hover:text-white p-2 rounded-xl hover:bg-purple-800/40 transition active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 p-[2px] shadow-lg shadow-pink-500/25 shrink-0">
            <div className="w-full h-full bg-[#1b0a33] rounded-[14px] flex items-center justify-center text-xl">
              🌙
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-1.5">
              <span>Luna AI</span>
              <span className="text-pink-400">❤️</span>
            </h2>
            <p className="text-xs text-purple-300/80">
              Sua conta pessoal com histórico e memórias protegidos
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        {(tab === 'login' || tab === 'register') && (
          <div className="flex p-1 bg-[#1d0b38] rounded-2xl border border-purple-800/40 mb-5">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${
                tab === 'login'
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md'
                  : 'text-purple-300 hover:text-white'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('register');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${
                tab === 'register'
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md'
                  : 'text-purple-300 hover:text-white'
              }`}
            >
              Criar Conta
            </button>
          </div>
        )}

        {/* Messages */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-xs text-rose-200 flex items-start gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="flex-1 leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-xs text-emerald-200 flex items-start gap-2 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="flex-1 leading-relaxed">{successMsg}</span>
          </div>
        )}

        {/* Google Authentication Section (Available on Login & Register) */}
        {(tab === 'login' || tab === 'register') && (
          <div className="mb-5">
            {googleConfig.configured ? (
              <div className="space-y-3">
                <div id="google-auth-btn-slot" className="flex justify-center min-h-[44px]" />
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-purple-800/60" />
                  <span className="flex-shrink mx-3 text-[11px] text-purple-400 uppercase tracking-wider">
                    ou com e-mail
                  </span>
                  <div className="flex-grow border-t border-purple-800/60" />
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-[#1b0a33] border border-purple-800/40 text-xs text-purple-300 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                  <span className="text-[11.5px]">Login com Google disponível</span>
                </div>
                <span className="text-[10px] text-pink-300 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/30">
                  Sem custos
                </span>
              </div>
            )}
          </div>
        )}

        {/* 1. LOGIN FORM */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1.5">
                E-mail ou Usuário
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-purple-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com ou usuario"
                  required
                  autoComplete="username"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-[#190930] border border-pink-500/25 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 text-white text-xs sm:text-sm placeholder-purple-400/50 outline-none transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-purple-200">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setTab('forgot_password');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-[11px] text-pink-300 hover:text-pink-200 hover:underline transition"
                >
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-purple-400 absolute left-3.5 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha secreta"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[#190930] border border-pink-500/25 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 text-white text-xs sm:text-sm placeholder-purple-400/50 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
                  className="absolute right-3.5 text-purple-400 hover:text-pink-300 p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-pink-500/20 transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Entrando na Luna...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Entrar na Minha Conta</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* 2. REGISTER FORM */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1.5">
                Seu Nome de Exibição
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-purple-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Como a Luna deve te chamar (ex: Edgar, Leo, Mari)"
                  autoComplete="name"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-[#190930] border border-pink-500/25 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 text-white text-xs sm:text-sm placeholder-purple-400/50 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1.5">
                E-mail
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-purple-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-[#190930] border border-pink-500/25 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 text-white text-xs sm:text-sm placeholder-purple-400/50 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1.5">
                Criar Senha (mínimo 6 caracteres)
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-purple-400 absolute left-3.5 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Pelo menos 6 caracteres"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[#190930] border border-pink-500/25 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 text-white text-xs sm:text-sm placeholder-purple-400/50 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
                  className="absolute right-3.5 text-purple-400 hover:text-pink-300 p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-pink-500/20 transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Criando sua conta...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Cadastrar Gratuitamente</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* 3. FORGOT PASSWORD FORM */}
        {tab === 'forgot_password' && (
          <form onSubmit={handleForgotPassword} className="space-y-4 animate-fadeIn">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs text-purple-300 hover:text-white transition mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao login</span>
            </button>

            <div>
              <h3 className="text-sm font-bold text-white mb-1">Recuperar Senha</h3>
              <p className="text-xs text-purple-300/80 leading-relaxed mb-3">
                Digite o e-mail cadastrado na Luna. Nós geraremos um código de recuperação seguro de 6 dígitos para você redefinir sua senha.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1.5">
                E-mail da sua conta
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-purple-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-[#190930] border border-pink-500/25 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 text-white text-xs sm:text-sm placeholder-purple-400/50 outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-pink-500/20 transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gerando código seguro...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Solicitar Código de Recuperação</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* 4. RESET PASSWORD FORM */}
        {tab === 'reset_password' && (
          <form onSubmit={handleResetPassword} className="space-y-4 animate-fadeIn">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs text-purple-300 hover:text-white transition mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao login</span>
            </button>

            {recoveryCodeNotice && (
              <div className="p-3.5 rounded-2xl bg-pink-950/60 border border-pink-500/40 text-xs text-pink-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-pink-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Código de Recuperação Gerado:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(recoveryCodeNotice)}
                    className="px-2 py-0.5 rounded bg-pink-900/60 hover:bg-pink-800 text-[10px] text-pink-200 flex items-center gap-1"
                  >
                    {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
                <div className="text-center py-1 font-mono text-lg font-bold tracking-widest text-white bg-black/40 rounded-xl">
                  {recoveryCodeNotice}
                </div>
                <p className="text-[10.5px] text-purple-300/80">
                  Insira este código abaixo junto com sua nova senha para redefini-la sem precisar de provedores externos pagos.
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1.5">
                Código de Verificação (6 dígitos)
              </label>
              <input
                type="text"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value.trim())}
                placeholder="Ex: 123456"
                required
                maxLength={6}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#190930] border border-pink-500/25 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 text-white font-mono text-center tracking-widest text-sm outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1.5">
                Nova Senha (mínimo 6 caracteres)
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-purple-400 absolute left-3.5 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite sua nova senha"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[#190930] border border-pink-500/25 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 text-white text-xs sm:text-sm placeholder-purple-400/50 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
                  className="absolute right-3.5 text-purple-400 hover:text-pink-300 p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-pink-500/20 transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Redefinindo senha...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirmar Nova Senha</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Creator / Edgar 1-click Quick Login (Zero configuration test) */}
        {tab === 'login' && (
          <div className="mt-5 pt-4 border-t border-purple-800/40 text-center">
            <button
              type="button"
              onClick={() => {
                setEmail('edgargames771@gmail.com');
                setPassword('edgar123');
              }}
              className="text-[11px] text-purple-400 hover:text-pink-300 transition flex items-center justify-center gap-1 mx-auto"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-pink-400" />
              <span>Preencher credenciais do Criador Edgar</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

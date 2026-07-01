'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, KeyRound, Fingerprint, Mail, X } from 'lucide-react';
import { LiquidButton } from '@/components/animate-ui/components/buttons/liquid';
import { Checkbox } from '@/components/animate-ui/components/headless/checkbox';
import { ModalPortal } from '@/components/ui/ModalPortal';
import { api } from '@/lib/api';
import { saveTokens } from '@/lib/auth';

interface MessageState {
  type: 'error' | 'ok';
  text: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  user: {
    id: string;
    email: string;
    role: 'user' | 'super_admin';
    isActive: boolean;
    lastLogin: string | null;
  };
  requiresTotp?: boolean;
  totpToken?: string | null;
}

// ─── WebAuthn Base64URL Helpers ──────────────────────────────────────────────
function base64urlToUint8Array(base64url: string): Uint8Array {
  const padding = '='.repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = window.btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export default function LoginCard() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [message, setMessage] = useState<MessageState | null>(null);

  const [step, setStep] = useState<'login' | 'totp'>('login');
  const [totpToken, setTotpToken] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState('');

  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError('Email wajib diisi.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotEmail)) {
      setForgotError('Format email tidak valid.');
      return;
    }
    setForgotError(null);
    setForgotLoading(true);
    
    try {
      const res = await api.post<{ message: string }>('/auth/forgot-password', { email: forgotEmail });
      setForgotModalOpen(false);
      setMessage({ type: 'ok', text: res.data.message });
      setForgotEmail('');
    } catch (err: any) {
      setForgotError(err.message || 'Gagal mengirim tautan reset password.');
    } finally {
      setForgotLoading(false);
    }
  };

  useEffect(() => {
    const isRemembered = localStorage.getItem('portal_remember') === 'true';
    if (isRemembered) {
      setEmail(localStorage.getItem('portal_email') || '');
      setRemember(true);
    } else {
      setRemember(false);
    }

    localStorage.removeItem('portal_password');
  }, []);


  const handlePasskeyLogin = async () => {
    if (loading) return;
    setMessage(null);
    setLoading(true);
    try {
      // 1. Get options from backend
      const optionsRes = await api.post<any>('/auth/passkey/login/options', { email });
      const { options, challengeToken } = optionsRes.data;

      // 2. Convert options challenge to Uint8Array
      const convertedOptions: CredentialRequestOptions = {
        publicKey: {
          challenge: base64urlToUint8Array(options.challenge) as any,
          rpId: options.rpId,
          userVerification: options.userVerification,
          timeout: options.timeout,
        }
      };

      if (options.allowCredentials) {
        convertedOptions.publicKey!.allowCredentials = options.allowCredentials.map((cred: any) => ({
          id: base64urlToUint8Array(cred.id) as any,
          type: cred.type,
          transports: cred.transports,
        }));
      }

      // 3. Trigger native credential request prompt
      const assertion = await navigator.credentials.get(convertedOptions);
      if (!assertion) {
        throw new Error('Gagal mendapatkan kredensial dari perangkat.');
      }

      const rawAssertion = assertion as PublicKeyCredential;
      const response = rawAssertion.response as AuthenticatorAssertionResponse;

      // 4. Format assertion payload
      const formattedResponse = {
        id: rawAssertion.id,
        rawId: rawAssertion.id,
        type: rawAssertion.type,
        response: {
          authenticatorData: arrayBufferToBase64url(response.authenticatorData),
          clientDataJSON: arrayBufferToBase64url(response.clientDataJSON),
          signature: arrayBufferToBase64url(response.signature),
          userHandle: response.userHandle ? arrayBufferToBase64url(response.userHandle) : null,
        }
      };

      // 5. Verify with backend
      const verifyRes = await api.post<LoginResponse>('/auth/passkey/login/verify', {
        loginResponse: formattedResponse,
        challengeToken
      });

      saveTokens(verifyRes.data.accessToken, verifyRes.data.refreshToken);
      setMessage({ type: 'ok', text: 'Login Passkey berhasil! Mengarahkan...' });

      setTimeout(() => {
        if (verifyRes.data.user.role === 'super_admin') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      }, 500);

    } catch (err: any) {
      console.error(err);
      setMessage({
        type: 'error',
        text: err.name === 'NotAllowedError'
          ? 'Proses autentikasi dibatalkan oleh pengguna atau perangkat.'
          : err.message || 'Gagal login menggunakan Passkey.',
      });
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (loading) return;
    if (!email || !password) {
      setMessage({ type: 'error', text: 'Mohon isi Email dan Password.' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage({ type: 'error', text: 'Format email tidak valid.' });
      return;
    }

    setMessage(null);
    setLoading(true);

    try {
      const res = await api.post<LoginResponse>('/auth/login', {
        email,
        password,
      });

      if (remember) {
        localStorage.setItem('portal_remember', 'true');
        localStorage.setItem('portal_email', email);
      } else {
        localStorage.removeItem('portal_remember');
        localStorage.removeItem('portal_email');
      }

      if (res.data.requiresTotp) {
        setTotpToken(res.data.totpToken || null);
        setStep('totp');
        setPassword('');
        setMessage({ type: 'ok', text: 'Masukkan 6 digit kode Authenticator Anda.' });
        setLoading(false);
        return;
      }

      saveTokens(res.data.accessToken, res.data.refreshToken);
      setMessage({ type: 'ok', text: 'Login berhasil! Mengarahkan...' });

      // Redirect based on role
      setTimeout(() => {
        if (res.data.user.role === 'super_admin') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      }, 500);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Gagal login. Silakan coba lagi.',
      });
      setLoading(false);
    }
  };

  const handleTotpSubmit = async () => {
    if (loading) return;
    if (!totpCode || totpCode.length !== 6) {
      setMessage({ type: 'error', text: 'Mohon masukkan 6 digit kode Authenticator.' });
      return;
    }

    setMessage(null);
    setLoading(true);

    try {
      const res = await api.post<LoginResponse>('/auth/login/totp-verify', {
        totpToken,
        code: totpCode,
      });

      saveTokens(res.data.accessToken, res.data.refreshToken);
      setMessage({ type: 'ok', text: 'Login berhasil! Mengarahkan...' });

      setTimeout(() => {
        if (res.data.user.role === 'super_admin') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      }, 500);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Kode Authenticator salah atau kadaluwarsa.',
      });
      setLoading(false);
    }
  };

  // const ssoLogin = (provider: string) => {
  //   console.log('[Portal PT INL] SSO via', provider);
  //   setMessage({ type: 'ok', text: `Login SSO via ${provider} sukses! (Simulasi sukses)` });
  //   setLoading(true);
  //   setTimeout(() => {
  //     setLoading(false);
  //   }, 1000);
  // };

  const fieldStyle = (name: string) =>
    focused === name
      ? 'border-brand ring-2 ring-brand/20 shadow-[0_4px_20px_-4px_rgba(var(--brand-rgb),0.12)] bg-white dark:bg-slate-900'
      : 'border-slate-200/80 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-950/30 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-950/40';

  return (
    <div className="w-full max-w-md animate-fade-up px-1 sm:px-0">
      <div className="login-card-wrapper rounded-3xl border border-white/10 border-t-white/35 border-l-white/35 dark:border-white/5 dark:border-t-white/20 dark:border-l-white/20 bg-white/10 dark:bg-slate-950/20 backdrop-filter backdrop-blur-md md:backdrop-blur-2xl ring-1 ring-white/10 dark:ring-white/5 p-5 sm:p-8 shadow-[0_32px_64px_rgba(15,23,42,0.18)] dark:shadow-[0_32px_64px_rgba(0,0,0,0.65)] relative overflow-hidden isolate transform-gpu">
        {/* Title Block */}
        <div className="login-card-title-block mb-4 sm:mb-5 text-center">
          <h2 className="login-card-title-text text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {step === 'login' ? 'Portal Apps' : 'Dua-Faktor (2FA)'}
          </h2>
          <p className="text-xs sm:text-sm font-bold tracking-wider text-brand dark:text-brand-dark mt-0.5 sm:mt-1 uppercase">PT. Industri Nabati Lestari</p>
          <p className="mt-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-305 leading-relaxed max-w-sm mx-auto">
            {step === 'login' 
              ? 'Gunakan akun portal Anda untuk mengakses seluruh aplikasi terintegrasi secara aman.'
              : 'Akun Anda dilindungi oleh Autentikasi Dua Faktor. Masukkan kode dari aplikasi Authenticator Anda.'
            }
          </p>
        </div>

        {/* Alert Messages */}
        {message && (
          <div
            className={`mb-4 sm:mb-5 flex items-start gap-2.5 rounded-2xl border p-3.5 text-sm font-medium animate-scale-in ${message.type === 'error'
              ? 'bg-rose-50/70 text-rose-700 border-rose-100'
              : 'bg-emerald-50/70 text-emerald-700 border-emerald-100'
              }`}
          >
            {message.type === 'error' ? (
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
            ) : (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {step === 'login' ? (
          <>
            {/* Input Fields */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="login-card-fields-spacing space-y-3.5"
            >
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Alamat Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused('user')}
                  onBlur={() => setFocused(null)}
                  placeholder="nama@inl.co.id"
                  autoComplete="email"
                  className={`login-card-input w-full rounded-2xl border px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${fieldStyle('user')}`}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocused('pw')}
                    onBlur={() => setFocused(null)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={`login-card-input w-full rounded-2xl border px-4 py-2.5 pr-11 text-sm text-slate-800 dark:text-slate-200 outline-none transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${fieldStyle('pw')}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 transition-colors hover:text-slate-700 dark:hover:text-slate-300 focus:outline-none cursor-pointer"
                    aria-label={showPw ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPw ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-0.5 pb-1">
                <label className="flex cursor-pointer select-none items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <Checkbox
                    checked={remember}
                    onChange={setRemember}
                    variant="portal"
                    type="button"
                  />
                  Ingat saya
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail('');
                    setForgotError(null);
                    setForgotModalOpen(true);
                  }}
                  className="text-xs font-bold text-brand dark:text-brand-dark transition-colors hover:text-brand-hover dark:hover:text-brand cursor-pointer focus:outline-none focus:underline"
                >
                  Lupa password?
                </button>
              </div>

              {/* Submit Button */}
              <LiquidButton
                type="submit"
                variant="outline"
                size="login"
                disabled={loading}
                className="login-card-button flex w-full items-center justify-center cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus:ring-2 focus:ring-brand/20 focus:outline-none"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memproses…
                  </span>
                ) : (
                  'Masuk Ke Portal'
                )}
              </LiquidButton>
            </form>

            {/* Divider */}
            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200/40 dark:bg-slate-800/40" />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">atau</span>
              <div className="h-px flex-1 bg-slate-200/40 dark:bg-slate-800/40" />
            </div>

            {/* Passkey Login Button */}
            <button
              type="button"
              onClick={handlePasskeyLogin}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 dark:bg-amber-500/10 dark:hover:bg-amber-500/15 px-4 py-2.5 text-sm font-bold text-amber-700 dark:text-amber-400 shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
            >
              <Fingerprint className="h-4.5 w-4.5 shrink-0 text-amber-650 dark:text-amber-400" />
              Masuk dengan Passkey
            </button>
          </>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleTotpSubmit();
            }}
            className="login-card-fields-spacing space-y-4"
          >
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 text-center">
                Masukkan Kode Keamanan
              </label>
              <input
                type="text"
                maxLength={6}
                pattern="[0-9]*"
                inputMode="numeric"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, ''))}
                onFocus={() => setFocused('totp')}
                onBlur={() => setFocused(null)}
                placeholder="000000"
                className={`login-card-input w-full rounded-2xl border px-4 py-2.5 text-center text-xl tracking-[0.3em] font-extrabold text-slate-850 dark:text-slate-100 outline-none transition-all duration-200 placeholder:text-slate-300 dark:placeholder:text-slate-750 ${fieldStyle('totp')}`}
                autoFocus
              />
            </div>

            <LiquidButton
              type="submit"
              variant="outline"
              size="login"
              disabled={loading}
              className="login-card-button flex w-full items-center justify-center cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus:ring-2 focus:ring-brand/20 focus:outline-none"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memverifikasi…
                </span>
              ) : (
                'Verifikasi & Masuk'
              )}
            </LiquidButton>

            <button
              type="button"
              onClick={() => {
                setStep('login');
                setTotpCode('');
                setMessage(null);
              }}
              className="flex w-full items-center justify-center text-xs font-bold text-slate-500 hover:text-slate-750 dark:text-slate-400 dark:hover:text-slate-205 transition-colors py-2 cursor-pointer focus:outline-none"
            >
              Kembali ke Login
            </button>
          </form>
        )}

        {/* Security Badge */}
        <div className="login-card-security-badge mt-5 pt-1 flex items-center justify-center gap-1.5 text-[10px] text-slate-555 dark:text-slate-400">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span className="font-semibold tracking-wide">Koneksi Terenkripsi & Aman</span>
        </div>
      </div>

      {/* ── Lupa Password Modal — via Portal */}
      <ModalPortal open={forgotModalOpen}>
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm z-[60]" onClick={() => setForgotModalOpen(false)} />
        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none z-[70]">
          <div className="pointer-events-auto w-full max-w-sm animate-fade-up">
            <form onSubmit={handleForgotSubmit} className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0d1218] shadow-2xl p-6">
              {/* Accent Line */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand to-transparent" />
              
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  {/* <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <Mail className="h-4 w-4 text-amber-550 dark:text-amber-455" />
                  </div> */}
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">Reset Password</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-405 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-700 dark:hover:text-slate-350 transition-all cursor-pointer focus:outline-none"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="mt-4 space-y-4">
                <p className="text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-400">
                  Masukkan email akun portal Anda. Kami akan mengirimkan tautan untuk mengatur ulang kata sandi Anda.
                </p>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Alamat Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className={`w-full rounded-xl border py-2.5 pl-10 pr-4 text-xs outline-none transition-all duration-200 text-slate-800 dark:text-slate-100 ${
                        forgotError
                          ? 'border-rose-500 bg-rose-500/[0.02] focus:border-rose-500 focus:ring-rose-500/10'
                          : 'border-slate-200/80 dark:border-white/[0.06] bg-slate-50/50 dark:bg-[#070b12] focus:border-brand/50 focus:bg-white dark:focus:bg-[#0a0f1a]'
                      }`}
                      autoFocus
                    />
                  </div>
                  {forgotError && (
                    <span className="text-[10px] text-rose-500 mt-1 block font-bold">{forgotError}</span>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(false)}
                  disabled={forgotLoading}
                  className="flex-1 rounded-xl border border-slate-250 dark:border-white/[0.08] px-4 py-2.5 text-xs font-bold text-slate-550 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:text-slate-700 dark:hover:text-slate-200 transition-all cursor-pointer focus:outline-none"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2.5 text-xs font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer focus:outline-none shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                >
                  {forgotLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />}
                  {forgotLoading ? 'Mengirim...' : 'Kirim Tautan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </ModalPortal>
    </div>
  );
}

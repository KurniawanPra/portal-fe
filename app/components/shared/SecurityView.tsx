'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  CheckCircle,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  KeyRound,
  Fingerprint
} from 'lucide-react';
import { api } from '@/lib/api';

interface UserMe {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  employeeId: string | null;
  totpEnabled: boolean;
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

interface SecurityViewProps {
  isAdmin?: boolean;
}

export default function SecurityView({ isAdmin = false }: SecurityViewProps) {
  // Password Change State
  const [passwordState, setPasswordState] = useState({ current: '', next: '', confirm: '' });
  const [showPws, setShowPws] = useState({ current: false, next: false, confirm: false });
  const [secMessage, setSecMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // UserMe, Passkeys, TOTP State
  const [userMe, setUserMe] = useState<UserMe | null>(null);
  const [loading, setLoading] = useState(true);

  const [passkeys, setPasskeys] = useState<any[]>([]);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [newPasskeyName, setNewPasskeyName] = useState('Perangkat Passkey');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [registering, setRegistering] = useState(false);
  const [passkeyStatus, setPasskeyStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [totpLoading, setTotpLoading] = useState(false);
  const [totpSecret, setTotpSecret] = useState('');
  const [totpQrUrl, setTotpQrUrl] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [totpSetupMode, setTotpSetupMode] = useState(false);
  const [totpConfirmPassword, setTotpConfirmPassword] = useState('');
  const [totpDisableMode, setTotpDisableMode] = useState(false);
  const [totpStatus, setTotpStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const fetchPasskeys = async () => {
    try {
      const res = await api.get<any[]>('/auth/passkey');
      setPasskeys(res.data || []);
    } catch (err) {
      console.error('Gagal memuat daftar passkey:', err);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecMessage(null);
    if (!passwordState.current || !passwordState.next || !passwordState.confirm) {
      setSecMessage({ type: 'err', text: 'Semua kolom password wajib diisi.' });
      return;
    }
    if (passwordState.next !== passwordState.confirm) {
      setSecMessage({ type: 'err', text: 'Konfirmasi password baru tidak cocok.' });
      return;
    }
    if (passwordState.next.length < 8) {
      setSecMessage({ type: 'err', text: 'Password baru minimal harus terdiri dari 8 karakter.' });
      return;
    }

    try {
      await api.put('/auth/password', {
        currentPassword: passwordState.current,
        newPassword: passwordState.next,
      });
      setSecMessage({ type: 'ok', text: 'Password Anda berhasil diperbarui!' });
      setPasswordState({ current: '', next: '', confirm: '' });
      setTimeout(() => {
        setSecMessage(null);
      }, 3000);
    } catch (err: any) {
      setSecMessage({ type: 'err', text: err.message || 'Gagal memperbarui password.' });
    }
  };

  const handleRenamePasskey = async (id: string) => {
    if (!editingName.trim()) return;
    try {
      await api.put(`/auth/passkey/${id}`, { name: editingName });
      setEditingId(null);
      setEditingName('');
      fetchPasskeys();
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah nama passkey');
    }
  };

  const handleDeletePasskey = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus passkey ini? Anda tidak akan bisa login dengan perangkat ini lagi.')) return;
    try {
      await api.delete(`/auth/passkey/${id}`);
      fetchPasskeys();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus passkey');
    }
  };

  const handleRegisterPasskey = async () => {
    setPasskeyLoading(true);
    setPasskeyStatus(null);
    try {
      const optionsRes = await api.post<any>('/auth/passkey/register/options', {});
      const { options, challengeToken } = optionsRes.data;

      const convertedOptions: CredentialCreationOptions = {
        publicKey: {
          challenge: base64urlToUint8Array(options.challenge) as any,
          rp: options.rp,
          user: {
            id: base64urlToUint8Array(options.user.id) as any,
            name: options.user.name,
            displayName: options.user.displayName,
          },
          pubKeyCredParams: options.pubKeyCredParams,
          timeout: options.timeout,
          attestation: options.attestation,
          authenticatorSelection: options.authenticatorSelection,
        }
      };

      if (options.excludeCredentials) {
        convertedOptions.publicKey!.excludeCredentials = options.excludeCredentials.map((cred: any) => ({
          id: base64urlToUint8Array(cred.id) as any,
          type: cred.type,
          transports: cred.transports,
        }));
      }

      const credential = await navigator.credentials.create(convertedOptions);
      if (!credential) {
        throw new Error('Gagal membuat kredensial baru pada perangkat.');
      }

      const rawCredential = credential as PublicKeyCredential;
      const response = rawCredential.response as AuthenticatorAttestationResponse;

      const formattedResponse = {
        id: rawCredential.id,
        rawId: rawCredential.id,
        type: rawCredential.type,
        response: {
          attestationObject: arrayBufferToBase64url(response.attestationObject),
          clientDataJSON: arrayBufferToBase64url(response.clientDataJSON),
          transports: response.getTransports ? response.getTransports() : [],
        }
      };

      await api.post('/auth/passkey/register/verify', {
        registrationResponse: formattedResponse,
        challengeToken,
        name: newPasskeyName || 'Perangkat Passkey'
      });

      setPasskeyStatus({ type: 'ok', text: 'Passkey berhasil didaftarkan!' });
      setNewPasskeyName('Perangkat Passkey');
      setRegistering(false);
      fetchPasskeys();
      setTimeout(() => {
        setPasskeyStatus(null);
      }, 3000);
    } catch (err: any) {
      console.error(err);
      setPasskeyStatus({
        type: 'err',
        text: err.name === 'NotAllowedError'
          ? 'Proses pendaftaran dibatalkan oleh pengguna atau perangkat.'
          : err.message || 'Gagal mendaftarkan Passkey.',
      });
    } finally {
      setPasskeyLoading(false);
    }
  };

  const handleStartTotpSetup = async () => {
    setTotpLoading(true);
    setTotpStatus(null);
    setTotpCode('');
    try {
      const res = await api.post<any>('/auth/totp/setup', {});
      setTotpSecret(res.data.secret);
      setTotpQrUrl(res.data.qrCodeUrl);
      setTotpSetupMode(true);
    } catch (err: any) {
      setTotpStatus({ type: 'err', text: err.response?.data?.error || err.message || 'Gagal menyiapkan Authenticator.' });
    } finally {
      setTotpLoading(false);
    }
  };

  const handleConfirmTotpEnable = async () => {
    if (!totpCode || totpCode.length !== 6) {
      setTotpStatus({ type: 'err', text: 'Mohon masukkan 6 digit kode dari aplikasi Authenticator Anda.' });
      return;
    }
    setTotpLoading(true);
    setTotpStatus(null);
    try {
      await api.post('/auth/totp/enable', { secret: totpSecret, code: totpCode });
      setTotpStatus({ type: 'ok', text: 'Aplikasi Authenticator berhasil diaktifkan!' });
      setTotpSetupMode(false);
      setTotpCode('');
      
      const meRes = await api.get<UserMe>('/auth/me');
      setUserMe(meRes.data);

      setTimeout(() => {
        setTotpStatus(null);
      }, 3000);
    } catch (err: any) {
      setTotpStatus({ type: 'err', text: err.response?.data?.error || err.message || 'Gagal memverifikasi kode.' });
    } finally {
      setTotpLoading(false);
    }
  };

  const handleDisableTotp = async () => {
    setTotpLoading(true);
    setTotpStatus(null);
    try {
      await api.post('/auth/totp/disable', { password: totpConfirmPassword });
      setTotpStatus({ type: 'ok', text: 'Aplikasi Authenticator berhasil dinonaktifkan.' });
      setTotpDisableMode(false);
      setTotpConfirmPassword('');
      
      const meRes = await api.get<UserMe>('/auth/me');
      setUserMe(meRes.data);
      setTimeout(() => {
        setTotpStatus(null);
      }, 3000);
    } catch (err: any) {
      setTotpStatus({ type: 'err', text: err.response?.data?.error || err.message || 'Gagal menonaktifkan Authenticator.' });
    } finally {
      setTotpLoading(false);
    }
  };

  useEffect(() => {
    const loadUserMe = async () => {
      try {
        const meRes = await api.get<UserMe>('/auth/me');
        setUserMe(meRes.data);
      } catch (err) {
        console.error('Gagal memuat status user:', err);
      } finally {
        setLoading(false);
      }
    };
    loadUserMe();
    fetchPasskeys();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex items-center gap-2.5">
          <Loader2 className="h-5 w-5 animate-spin text-slate-500 dark:text-slate-400" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Memuat status keamanan...</p>
        </div>
      </div>
    );
  }

  const pageTitle = isAdmin ? 'Keamanan Panel Admin' : 'Keamanan Akun & Kredensial';
  const pageDesc = isAdmin
    ? 'Kelola kata sandi dan kredensial akses administrator Portal SSO.'
    : 'Kelola kata sandi dan otentikasi multi-faktor (2FA) akun Portal SSO Anda.';

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
          {pageTitle}
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {pageDesc}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Shield Status Card */}
        {!isAdmin && (
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col items-center text-center h-fit">
            <div className="h-10 w-10 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center mb-3 border border-slate-100 dark:border-slate-700">
              <ShieldCheck className="h-5 w-5 text-slate-700 dark:text-slate-200" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Status Keamanan</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Kelola perlindungan login dan kredensial Anda.</p>

            <div className="mt-5 w-full border-t border-slate-100 dark:border-slate-800/80 pt-4 text-left space-y-4">
              {/* 2FA Status */}
              <div className="flex items-start gap-2.5 text-xs">
                {userMe?.totpEnabled ? (
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">Aplikasi Authenticator (2FA)</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                    {userMe?.totpEnabled 
                      ? 'Aktif (Dilindungi dengan kode dinamis)' 
                      : 'Tidak Aktif (Rentan terhadap kebocoran kata sandi)'}
                  </p>
                </div>
              </div>

              {/* Passkey Status */}
              <div className="flex items-start gap-2.5 text-xs">
                {passkeys.length > 0 ? (
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">Passkey Keamanan</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                    {passkeys.length > 0 
                      ? `Aktif (${passkeys.length} perangkat terdaftar)` 
                      : 'Tidak Aktif (Belum ada perangkat terdaftar)'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Right Column: Security Configurations */}
        <div className={`${isAdmin ? 'lg:col-span-3' : 'lg:col-span-2'} space-y-6`}>
          {/* Password Change Form */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800/80 pb-3 mb-4">
              Ganti Password Akun
            </h3>

            {secMessage && (
              <div
                className={`mb-4 flex items-start gap-2.5 rounded-lg border p-3.5 text-xs font-semibold ${
                  secMessage.type === 'ok'
                    ? 'bg-emerald-55/10 text-emerald-700 border-emerald-500/10 dark:text-emerald-400'
                    : 'bg-rose-50/10 text-rose-700 border-rose-500/10 dark:text-rose-455'
                }`}
              >
                {secMessage.type === 'ok' ? (
                  <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                )}
                <span>{secMessage.text}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Password Saat Ini
                </label>
                <div className="relative">
                  <input
                    type={showPws.current ? 'text' : 'password'}
                    value={passwordState.current}
                    onChange={(e) => setPasswordState({ ...passwordState, current: e.target.value })}
                    placeholder="Masukkan password lama"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-slate-400 dark:focus:border-slate-650 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPws({ ...showPws, current: !showPws.current })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 focus:outline-none cursor-pointer"
                  >
                    {showPws.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Password Baru
                </label>
                <div className="relative">
                  <input
                    type={showPws.next ? 'text' : 'password'}
                    value={passwordState.next}
                    onChange={(e) => setPasswordState({ ...passwordState, next: e.target.value })}
                    placeholder="Minimal 8 karakter"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-955/40 px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-550 outline-none focus:border-slate-400 dark:focus:border-slate-650 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPws({ ...showPws, next: !showPws.next })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 focus:outline-none cursor-pointer"
                  >
                    {showPws.next ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Konfirmasi Password Baru
                </label>
                <div className="relative">
                  <input
                    type={showPws.confirm ? 'text' : 'password'}
                    value={passwordState.confirm}
                    onChange={(e) => setPasswordState({ ...passwordState, confirm: e.target.value })}
                    placeholder="Ulangi password baru"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-955/40 px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-550 outline-none focus:border-slate-400 dark:focus:border-slate-650 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPws({ ...showPws, confirm: !showPws.confirm })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 focus:outline-none cursor-pointer"
                  >
                    {showPws.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-lg bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 px-4 py-2 text-xs font-semibold text-white dark:text-slate-900 transition-colors cursor-pointer"
              >
                Perbarui Password
              </button>
            </form>
          </div>

          {/* Keamanan Akun & Passkey (CRUD) */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800/80 pb-3 mb-4">
              Keamanan Akun & Passkey
            </h3>
            
            <div className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Passkey memungkinkan Anda masuk secara aman menggunakan biometrik (sidik jari/wajah) atau PIN perangkat tanpa mengetikkan sandi. Anda dapat mendaftarkan beberapa perangkat di bawah ini.
              </p>

              {/* Passkeys List */}
              <div className="space-y-2.5">
                <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Perangkat Terdaftar ({passkeys.length})</h4>
                {passkeys.length === 0 ? (
                  <p className="text-xs text-slate-450 dark:text-slate-500 italic bg-slate-50/50 dark:bg-slate-950/20 p-4 border border-slate-100/60 dark:border-slate-850 rounded-xl">Belum ada passkey terdaftar.</p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-150 dark:border-slate-800/85 rounded-xl overflow-hidden text-xs">
                    {passkeys.map((pk) => (
                      <div key={pk.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/20 dark:bg-slate-950/5 hover:bg-slate-50/50 dark:hover:bg-slate-950/15 transition-colors">
                        <div className="flex items-start gap-2.5">
                          <Fingerprint className="h-5 w-5 text-slate-450 dark:text-slate-500 shrink-0 mt-0.5" />
                          {editingId === pk.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg px-2.5 py-1 outline-none text-xs font-semibold w-40 text-slate-800 dark:text-slate-200 focus:border-slate-400"
                                placeholder="Nama perangkat"
                              />
                              <button
                                onClick={() => handleRenamePasskey(pk.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-2.5 py-1 text-[10px] font-bold cursor-pointer"
                              >
                                Simpan
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-350 text-slate-700 dark:text-slate-355 rounded-lg px-2.5 py-1 text-[10px] font-bold cursor-pointer"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">{pk.name}</p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                                Terdaftar: {new Date(pk.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} • Penggunaan: {pk.counter}x
                              </p>
                            </div>
                          )}
                        </div>
                        {editingId !== pk.id && (
                          <div className="flex items-center gap-2 text-[10px] font-bold">
                            <button
                               onClick={() => {
                                setEditingId(pk.id);
                                setEditingName(pk.name);
                              }}
                              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-250 cursor-pointer"
                            >
                              Edit Nama
                            </button>
                            <span className="text-slate-200 dark:text-slate-800">|</span>
                            <button
                              onClick={() => handleDeletePasskey(pk.id)}
                              className="text-rose-600 hover:text-rose-700 cursor-pointer"
                            >
                              Hapus
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Passkey Action */}
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3.5">
                {registering ? (
                  <div className="space-y-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850 p-4 rounded-xl">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Nama Perangkat Passkey:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newPasskeyName}
                        onChange={(e) => setNewPasskeyName(e.target.value)}
                        className="flex-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg px-3 py-1.5 outline-none text-xs font-semibold text-slate-800 dark:text-slate-200 focus:border-slate-400"
                        placeholder="Contoh: Laptop Kerja, HP Saya"
                      />
                      <button
                        onClick={handleRegisterPasskey}
                        disabled={passkeyLoading}
                        className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 disabled:bg-slate-400 text-white dark:text-slate-900 rounded-lg px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed transition-colors"
                      >
                        {passkeyLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Fingerprint className="h-3.5 w-3.5" />}
                        Daftar
                      </button>
                      <button
                        onClick={() => setRegistering(false)}
                        className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-350 rounded-lg px-3.5 py-1.5 text-xs font-semibold cursor-pointer transition-colors"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setRegistering(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    <Fingerprint className="h-4 w-4 text-slate-500 shrink-0" />
                    Tambah Passkey Perangkat Ini
                  </button>
                )}
              </div>

              {passkeyStatus && (
                <div
                  className={`flex items-start gap-2 rounded-lg border p-3 text-xs font-semibold ${
                    passkeyStatus.type === 'ok'
                      ? 'bg-emerald-50/10 text-emerald-700 border-emerald-500/10 dark:text-emerald-400'
                      : 'bg-rose-50/10 text-rose-700 border-rose-500/10 dark:text-rose-455'
                  }`}
                >
                  <Fingerprint className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span>{passkeyStatus.text}</span>
                </div>
              )}
            </div>
          </div>

          {/* Aplikasi Authenticator (2FA/TOTP) */}
          {userMe?.role !== 'super_admin' && (
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800/80 pb-3 mb-4">
                Aplikasi Authenticator (2FA)
              </h3>

              <div className="space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Amankan akun Anda dengan Autentikasi Dua Faktor (2FA). Setelah diaktifkan, Anda harus memasukkan kode 6-digit dari aplikasi authenticator saat masuk menggunakan password.
                </p>

                {userMe?.totpEnabled ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-emerald-500/10 bg-emerald-50/10 text-emerald-700 dark:text-emerald-450 text-xs font-semibold">
                      <KeyRound className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                      <div>
                        <p className="font-semibold">Aplikasi Authenticator Aktif</p>
                        <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">Akun Anda saat ini terlindungi dengan 2FA.</p>
                      </div>
                    </div>

                    {totpDisableMode ? (
                      <div className="space-y-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850 p-4 rounded-xl">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Masukkan Password Anda untuk menonaktifkan:</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="password"
                            value={totpConfirmPassword}
                            onChange={(e) => setTotpConfirmPassword(e.target.value)}
                            className="flex-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg px-3 py-1.5 outline-none text-xs font-semibold text-slate-800 dark:text-slate-200 focus:border-slate-400"
                            placeholder="Password akun Anda"
                          />
                          <button
                            onClick={handleDisableTotp}
                            disabled={totpLoading}
                            className="bg-rose-600 hover:bg-rose-700 disabled:bg-rose-450 text-white rounded-lg px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed transition-colors"
                          >
                            {totpLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            Nonaktifkan
                          </button>
                          <button
                            onClick={() => { setTotpDisableMode(false); setTotpConfirmPassword(''); }}
                            className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-350 text-slate-700 dark:text-slate-355 rounded-lg px-3.5 py-1.5 text-xs font-semibold cursor-pointer transition-colors"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setTotpDisableMode(true)}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 dark:border-rose-90 bg-rose-50/10 hover:bg-rose-100/10 px-3.5 py-2 text-xs font-semibold text-rose-700 dark:text-rose-450 transition-colors cursor-pointer"
                      >
                        Nonaktifkan Authenticator
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {totpSetupMode ? (
                      <div className="space-y-4 bg-slate-50/40 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850 p-4 rounded-xl text-xs">
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                          {totpQrUrl && (
                            <div className="bg-white p-2 rounded-lg border border-slate-200/60 dark:border-slate-700 shrink-0">
                              <img src={totpQrUrl} alt="QR Code 2FA" className="h-28 w-28" />
                            </div>
                          )}
                          <div className="space-y-2 flex-1">
                            <p className="font-semibold text-slate-800 dark:text-slate-200">Aktivasi:</p>
                            <ol className="list-decimal list-inside space-y-1 text-slate-550 dark:text-slate-400 font-medium">
                              <li>Scan QR Code dengan aplikasi Authenticator Anda.</li>
                              <li>Atau masukkan setup key manual ini:<br />
                                <code className="mt-1 block p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold rounded text-center tracking-wider select-all border border-slate-200 dark:border-slate-700">{totpSecret}</code>
                              </li>
                              <li>Masukkan 6 digit kode yang tampil di aplikasi.</li>
                            </ol>
                          </div>
                        </div>

                        <div className="border-t border-slate-150 dark:border-slate-800/80 pt-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="flex-1">
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1">Kode Verifikasi:</label>
                            <input
                              type="text"
                              maxLength={6}
                              value={totpCode}
                              onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, ''))}
                              className="w-full border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg px-3 py-1.5 outline-none text-sm font-semibold text-slate-800 dark:text-slate-200 text-center tracking-[0.2em]"
                              placeholder="000000"
                            />
                          </div>
                          <div className="flex items-end gap-2 sm:pt-4">
                            <button
                              onClick={handleConfirmTotpEnable}
                              disabled={totpLoading}
                              className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 disabled:bg-slate-400 text-white dark:text-slate-900 rounded-lg px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed transition-colors"
                            >
                              {totpLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                              Aktifkan
                            </button>
                            <button
                              onClick={() => { setTotpSetupMode(false); setTotpSecret(''); setTotpQrUrl(''); }}
                              className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-355 rounded-lg px-3.5 py-2 text-xs font-semibold cursor-pointer transition-colors"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={handleStartTotpSetup}
                        disabled={totpLoading}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-205 dark:border-slate-750 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-750 dark:text-slate-300 transition-colors cursor-pointer"
                      >
                        {totpLoading ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <KeyRound className="h-4 w-4 text-slate-500 shrink-0" />}
                        Aktifkan Aplikasi Authenticator
                      </button>
                    )}
                  </div>
                )}

                {totpStatus && (
                  <div
                    className={`flex items-start gap-2.5 rounded-lg border p-3 text-xs font-semibold ${
                      totpStatus.type === 'ok'
                        ? 'bg-emerald-50/10 text-emerald-700 border-emerald-500/10 dark:text-emerald-450'
                        : 'bg-rose-50/10 text-rose-700 border-rose-500/10 dark:text-rose-455'
                    }`}
                  >
                    <KeyRound className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                    <span>{totpStatus.text}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

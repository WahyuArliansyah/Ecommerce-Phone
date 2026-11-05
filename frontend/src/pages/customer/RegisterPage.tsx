import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth, type User } from '../../context/AuthContext';
import AuthShell from '../../components/AuthShell';
import { apiError } from '../../utils/profile';
import { useToast } from '../../context/ToastContext';

const inputBase =
    'h-12 w-full rounded-lg border border-[#8A93A0] bg-white text-base text-[#131820] outline-none transition-colors placeholder:text-[#6B7480] focus:border-[#0A7C86] focus:ring-[3px] focus:ring-[#0A7C86]/25';
const labelClass = 'mb-1.5 block text-sm font-semibold text-[#131820]';

// Aturan yang sama dengan registerSchema di backend
function validate(f: { name: string; phone: string; password: string; confirm: string }): string | null {
    const name = f.name.trim();
    if (name.length < 2) return 'Nama minimal 2 karakter';
    if (!/^[\p{L}\p{N} .'-]+$/u.test(name)) return 'Nama tidak boleh mengandung karakter khusus';
    if (/admin/i.test(name)) return 'Nama tidak boleh mengandung kata "admin"';
    if (f.phone.trim() && !/^(\+62|62|0)8\d{8,11}$/.test(f.phone.trim())) return 'Nomor HP tidak valid (contoh: 081234567890)';
    if (f.password.length < 8) return 'Password minimal 8 karakter';
    if (!/[A-Za-z]/.test(f.password)) return 'Password harus mengandung huruf';
    if (!/\d/.test(f.password)) return 'Password harus mengandung angka';
    if (f.password !== f.confirm) return 'Konfirmasi password tidak sama dengan password';
    return null;
}

function PasswordInput({
    id,
    label,
    value,
    onChange,
    autoComplete,
    describedBy,
    hint,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    autoComplete: string;
    describedBy?: string;
    hint?: string;
}) {
    const [show, setShow] = useState(false);
    return (
        <div className="mt-5">
            <label htmlFor={id} className={labelClass}>
                {label}
            </label>
            <div className="relative">
                <input
                    id={id}
                    type={show ? 'text' : 'password'}
                    required
                    maxLength={72}
                    autoComplete={autoComplete}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    aria-describedby={[hint ? `${id}-hint` : '', describedBy ?? ''].filter(Boolean).join(' ') || undefined}
                    className={`${inputBase} pl-4 pr-12`}
                />
                <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}
                    aria-pressed={show}
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-lg text-[#5A6472] transition-colors hover:text-[#131820] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-[#0A7C86]/50"
                >
                    {show ? (
                        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                            <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                        </svg>
                    ) : (
                        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                    )}
                </button>
            </div>
            {hint && (
                <p id={`${id}-hint`} className="mt-1.5 text-xs text-[#5A6472]">
                    {hint}
                </p>
            )}
        </div>
    );
}

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        const problem = validate({ name, phone, password, confirm });
        if (problem) {
            setError(problem);
            return;
        }

        setLoading(true);
        try {
            const res = await api.post<{ token: string; user: User }>('/auth/register', {
                name: name.trim(),
                email: email.trim(),
                password,
                ...(phone.trim() ? { phone: phone.trim() } : {}),
            });
            login(res.data.token, res.data.user);
            toast.success(`Akun berhasil dibuat. Selamat datang, ${res.data.user.name}!`);
            navigate('/', { replace: true });
        } catch (err) {
            toast.error(apiError(err, 'Pendaftaran gagal. Periksa koneksi internet Anda, lalu coba lagi.'));
        } finally {
            setLoading(false);
        }
    };

    const errorId = error ? 'register-error' : undefined;

    return (
        <AuthShell>
            <h1 className="text-[28px] font-extrabold leading-tight tracking-[-0.03em] text-[#131820]">Daftar ke ArliPhone</h1>
            <p className="mt-2 text-base leading-normal text-[#5A6472]">Buat akun untuk mulai berbelanja.</p>

            {error && (
                <div
                    id="register-error"
                    role="alert"
                    className="mt-6 rounded-lg border border-[#B42318]/30 bg-[#B42318]/10 px-4 py-3 text-sm leading-normal text-[#B42318]"
                >
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} aria-busy={loading} className="mt-8">
                <div>
                    <label htmlFor="reg-name" className={labelClass}>
                        Nama
                    </label>
                    <input
                        id="reg-name"
                        required
                        minLength={2}
                        maxLength={100}
                        autoComplete="name"
                        placeholder="Nama Lengkap"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        aria-describedby={errorId}
                        className={`${inputBase} px-4`}
                    />
                </div>

                <div className="mt-5">
                    <label htmlFor="reg-email" className={labelClass}>
                        Email
                    </label>
                    <input
                        id="reg-email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="nama@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        aria-describedby={errorId}
                        className={`${inputBase} px-4`}
                    />
                </div>

                <div className="mt-5">
                    <label htmlFor="reg-phone" className={labelClass}>
                        Nomor HP <span className="font-normal text-[#5A6472]"></span>
                    </label>
                    <input
                        id="reg-phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="081234567890"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        aria-describedby={errorId}
                        className={`${inputBase} px-4`}
                    />
                </div>
                
                <PasswordInput
                    id="reg-password"
                    label="Password"
                    value={password}
                    onChange={setPassword}
                    autoComplete="new-password"
                    describedBy={errorId}
                    hint="Minimal 8 karakter, mengandung huruf dan angka."
                />

                <PasswordInput
                    id="reg-confirm"
                    label="Ulangi password"
                    value={confirm}
                    onChange={setConfirm}
                    autoComplete="new-password"
                    describedBy={errorId}
                />

                <button
                    type="submit"
                    disabled={loading}
                    className="cursor-pointer mt-7 h-12 w-full rounded-lg bg-[#0A7C86] text-base font-bold text-white transition-[background-color,transform] hover:bg-[#086872] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#0A7C86]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#EEF0EB] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {loading ? 'Mendaftarkan…' : 'Daftar'}
                </button>
            </form>

            <p className="mt-8 text-sm text-[#5A6472]">
                Sudah punya akun?{' '}
                <Link
                    to="/login"
                    className="cursor-pointer rounded font-semibold text-[#086872] underline underline-offset-4 hover:text-[#131820] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#0A7C86]/50"
                >
                    Masuk
                </Link>
            </p>
        </AuthShell>
    );
}
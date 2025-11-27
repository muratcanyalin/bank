'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      console.log('Login attempt:', { email: formData.email, password: formData.password ? '***' : 'empty' });
      if (!formData.email || !formData.password) {
        throw new Error('E-posta ve şifre gereklidir');
      }
      const result = await api.login(formData.email, formData.password);
      console.log('Login success:', result);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-900">
      <form onSubmit={handleSubmit} className="card w-full max-w-sm space-y-6">
        <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Giriş Yap</h2>
        <div>
          <label className="block text-sm font-medium mb-2">E-posta</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} className="input w-full" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Şifre</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} className="input w-full" required />
        </div>
        {error && <div className="text-red-600 py-2">{error}</div>}
        <button type="submit" className="btn-primary w-full" disabled={loading}>{loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}</button>
      </form>
    </div>
  );
}

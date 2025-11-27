'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { api } from '@/lib/api';

export default function TransferPage() {
  const [formData, setFormData] = useState({
    fromAccount: '',
    toAccount: '',
    amount: '',
    description: '',
  });

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const response = await api.getAccounts() as { accounts?: any[] };
      setAccounts(response.accounts || []);
    } catch (err: any) {
      console.error('Accounts load error:', err);
      setError('Hesaplar yüklenirken bir hata oluştu');
      setAccounts([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Find account by ID or use first account
      const fromAccount = accounts.find(a => a.id === formData.fromAccount);
      if (!fromAccount) {
        throw new Error('Gönderen hesap bulunamadı');
      }

      // toAccount can be account ID or account number
      await api.createTransfer({
        fromAccountId: formData.fromAccount,
        toAccountIdentifier: formData.toAccount.trim(), // Account ID or account number
        amount: parseFloat(formData.amount),
        description: formData.description || undefined,
      });

      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Transfer işlemi başarısız oldu');
      console.error('Transfer error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (step === 2) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <div className="card text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Transfer Başarılı!
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Para transferi işleminiz başarıyla tamamlandı.
            </p>
            <div className="space-y-2 mb-6 text-left bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Gönderen:</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {accounts.find(a => a.id === formData.fromAccount)?.name || accounts.find(a => a.id === formData.fromAccount)?.accountType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Alıcı:</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {formData.toAccount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Tutar:</span>
                <span className="font-bold text-primary-600 dark:text-primary-400">
                  {parseFloat(formData.amount).toLocaleString('tr-TR', {
                    style: 'currency',
                    currency: 'TRY',
                  })}
                </span>
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setStep(1);
                  setFormData({ fromAccount: '', toAccount: '', amount: '', description: '' });
                }}
                className="flex-1 btn-secondary"
              >
                Yeni Transfer
              </button>
              <a href="/transactions" className="flex-1 btn-primary text-center">
                İşlem Geçmişi
              </a>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Para Transferi
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Hesaplarınız arasında veya başka hesaplara para transferi yapın
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-6">
          {/* From Account */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Gönderen Hesap
            </label>
            <select
              name="fromAccount"
              value={formData.fromAccount}
              onChange={handleInputChange}
              className="input"
              required
            >
              <option value="">Hesap seçin</option>
              {accounts
                .filter((acc) => acc.isActive && !acc.isFrozen)
                .map((account) => (
                  <option key={account.id} value={account.id}>
                    {(account.name || account.accountType)} ({account.accountNumber || account.number}) - {Number(account.balance || 0).toLocaleString('tr-TR', {style: 'currency', currency: 'TRY'})}
                    {account.isFrozen && ' (Dondurulmuş)'}
                  </option>
                ))}
            </select>
            {accounts.filter((acc) => acc.isActive && !acc.isFrozen).length === 0 && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                Aktif ve dondurulmamış hesap bulunmuyor.
              </p>
            )}
          </div>

          {/* To Account */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Alıcı Hesap / IBAN
            </label>
            <input
              type="text"
              name="toAccount"
              value={formData.toAccount}
              onChange={handleInputChange}
              placeholder="Hesap numarası veya hesap ID'si (örn: TR1234567890)"
              className="input"
              required
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Alıcı hesap numarasını girin (örn: TR1234567890)
            </p>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Tutar (TRY)
            </label>
            <div className="relative">
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                min="0.01"
                className="input pr-12"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                ₺
              </span>
            </div>
            {formData.fromAccount && formData.amount && (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Kalan bakiye:{' '}
                <span className="font-medium">
                  {(
                    (Number(accounts.find((a) => a.id === formData.fromAccount)?.balance || 0)) -
                    parseFloat(formData.amount || '0')
                  ).toLocaleString('tr-TR', {
                    style: 'currency',
                    currency: 'TRY',
                  })}
                </span>
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Açıklama (Opsiyonel)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Transfer açıklaması..."
              rows={3}
              className="input"
            />
          </div>

          {/* Security Notice */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <span className="text-xl">⚠️</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Güvenlik Uyarısı
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  Transfer işleminizi onaylamadan önce tüm bilgileri kontrol edin.
                  İşlem geri alınamaz.
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex space-x-4 pt-4">
            <a href="/dashboard" className="flex-1 btn-secondary text-center">
              İptal
            </a>
            <button
              type="submit"
              className="flex-1 btn-primary"
              disabled={!formData.fromAccount || !formData.toAccount || !formData.amount || loading}
            >
              {loading ? 'İşleniyor...' : 'Transfer Et'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}


'use client';

import Layout from '@/components/layout/Layout';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';

export default function AccountsPage() {
  const toast = useToast();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showNewAccountModal, setShowNewAccountModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showCloseAccountModal, setShowCloseAccountModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  
  // New account form states
  const [newAccountStep, setNewAccountStep] = useState(1);
  const [newAccountForm, setNewAccountForm] = useState({
    accountType: '',
    currency: 'TRY',
    branchCode: '',
    initialBalance: '',
  });
  const [creatingAccount, setCreatingAccount] = useState(false);
  
  // Close account states
  const [transferToAccount, setTransferToAccount] = useState('');
  const [closingAccount, setClosingAccount] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const data = await api.getAccounts() as { accounts?: any[] };
      setAccounts(Array.isArray(data.accounts) ? data.accounts : []);
    } catch (err: any) {
      console.error('Accounts fetch error:', err);
      setError(err.message || 'Veri çekilemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    if (newAccountStep === 1) {
      if (!newAccountForm.accountType) {
        setError('Hesap türü seçiniz');
        return;
      }
      setNewAccountStep(2);
      setError(null);
      return;
    }

    // Step 2 - Create account
    setCreatingAccount(true);
    setError(null);
    try {
      await api.createAccount({
        accountType: newAccountForm.accountType,
        currency: newAccountForm.currency,
        branchName: newAccountForm.branchCode || undefined, // branchCode field is used for branchName
        initialBalance: newAccountForm.initialBalance ? parseFloat(newAccountForm.initialBalance) : undefined,
      });
      
      // Reset form and close modal
      setNewAccountForm({ accountType: '', currency: 'TRY', branchCode: '', initialBalance: '' });
      setNewAccountStep(1);
      setShowNewAccountModal(false);
      await fetchAccounts(); // Refresh accounts list
      toast.showToast('Hesap başarıyla oluşturuldu', 'success');
    } catch (err: any) {
      const errorMsg = err.message || 'Hesap oluşturulurken hata oluştu';
      setError(errorMsg);
      toast.showToast(errorMsg, 'error');
    } finally {
      setCreatingAccount(false);
    }
  };

  const handleAccountAction = async (action: 'freeze' | 'unfreeze' | 'close') => {
    if (!selectedAccount) return;

    setError(null);
    try {
      if (action === 'close') {
        // Check if account has balance
        if (Number(selectedAccount.balance) > 0) {
          // Show close account modal with transfer option
          setShowActionModal(false);
          setShowCloseAccountModal(true);
          return;
        }
        await api.deactivateAccount(selectedAccount.id);
        toast.showToast('Hesap başarıyla kapatıldı', 'success');
      } else {
        await api.updateAccount(selectedAccount.id, {
          isFrozen: action === 'freeze',
        });
        toast.showToast(
          action === 'freeze' ? 'Hesap başarıyla donduruldu' : 'Hesap başarıyla açıldı',
          'success'
        );
      }
      setShowActionModal(false);
      setShowCloseAccountModal(false);
      setSelectedAccount(null);
      await fetchAccounts(); // Refresh accounts list
    } catch (err: any) {
      const errorMsg = err.message || 'İşlem başarısız oldu';
      setError(errorMsg);
      toast.showToast(errorMsg, 'error');
    }
  };

  const handleCloseAccountWithTransfer = async () => {
    if (!selectedAccount || !transferToAccount) {
      toast.showToast('Lütfen bir hesap seçin', 'warning');
      return;
    }

    if (transferToAccount === selectedAccount.id) {
      toast.showToast('Aynı hesaba transfer yapılamaz', 'error');
      return;
    }

    setClosingAccount(true);
    setError(null);
    try {
      // Transfer remaining balance
      await api.createTransfer({
        fromAccountId: selectedAccount.id,
        toAccountIdentifier: transferToAccount,
        amount: Number(selectedAccount.balance),
        description: 'Hesap kapatma - Bakiye transferi',
      });

      // Close account
      await api.deactivateAccount(selectedAccount.id);
      
      toast.showToast('Hesap başarıyla kapatıldı ve bakiye transfer edildi', 'success');
      setShowCloseAccountModal(false);
      setShowActionModal(false);
      setSelectedAccount(null);
      setTransferToAccount('');
      await fetchAccounts();
    } catch (err: any) {
      const errorMsg = err.message || 'Hesap kapatılamadı';
      setError(errorMsg);
      toast.showToast(errorMsg, 'error');
    } finally {
      setClosingAccount(false);
    }
  };

  const getAccountTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      CHECKING: 'Vadesiz',
      SAVINGS: 'Vadeli',
      CREDIT: 'Kredi',
    };
    return types[type] || type;
  };

  const getAccountIcon = (type: string) => {
    const icons: Record<string, string> = {
      CHECKING: '💳',
      SAVINGS: '🏦',
      CREDIT: '💳',
    };
    return icons[type] || '💳';
  };

  const getCurrencyLabel = (currency: string) => {
    const currencies: Record<string, string> = {
      TRY: 'Türk Lirası',
      USD: 'Amerikan Doları',
      EUR: 'Euro',
      GBP: 'İngiliz Sterlini',
    };
    return currencies[currency] || currency;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Hesaplarım</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Tüm hesaplarınızı görüntüleyin ve yönetin</p>
          </div>
          <button 
            onClick={() => {
              setShowNewAccountModal(true);
              setNewAccountStep(1);
              setNewAccountForm({ accountType: '', currency: 'TRY', branchCode: '', initialBalance: '' });
              setError(null);
            }}
            className="btn-primary"
          >
            + Yeni Hesap
          </button>
        </div>

        {error && !showNewAccountModal && !showDetailModal && !showActionModal && (
          <div className="card bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Accounts List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-2 card">Yükleniyor...</div>
          ) : error && !showNewAccountModal ? (
            <div className="col-span-2 card text-red-600">{error}</div>
          ) : accounts.length === 0 ? (
            <div className="col-span-2 card">Henüz hesap yok</div>
          ) : accounts.map((account) => (
            <div key={account.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-3xl">
                    {getAccountIcon(account.accountType)}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                      {account.name || getAccountTypeLabel(account.accountType)}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {getAccountTypeLabel(account.accountType)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {account.isActive && !account.isFrozen && (
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-medium rounded-full">
                      Aktif
                    </span>
                  )}
                  {account.isFrozen && (
                    <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs font-medium rounded-full">
                      Dondurulmuş
                    </span>
                  )}
                  {!account.isActive && (
                    <span className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs font-medium rounded-full">
                      Kapalı
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Hesap Numarası</p>
                  <p className="text-lg font-mono text-slate-900 dark:text-white">
                    {account.accountNumber || account.number}
                  </p>
                </div>
                {account.branchCode && (
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Şube</p>
                    <p className="text-sm text-slate-900 dark:text-white">
                      {account.branchCode} {account.branchName ? `- ${account.branchName}` : ''}
                    </p>
                  </div>
                )}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Bakiye</p>
                  <p className={`text-3xl font-bold ${Number(account.balance) >= 0 ? 'text-primary-600 dark:text-primary-400' : 'text-red-600 dark:text-red-400'}`}>
                    {Number(account.balance).toLocaleString('tr-TR', {
                      style: 'currency',
                      currency: account.currency || 'TRY',
                    })}
                  </p>
                </div>
                <div className="flex space-x-2 pt-4">
                  <button 
                    onClick={() => {
                      setSelectedAccount(account);
                      setShowDetailModal(true);
                      setError(null);
                    }}
                    className="flex-1 btn-secondary text-sm"
                  >
                    Detaylar
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedAccount(account);
                      setShowActionModal(true);
                      setError(null);
                    }}
                    className="flex-1 btn-primary text-sm"
                  >
                    İşlem Yap
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Card */}
        <div className="card bg-gradient-to-r from-slate-800 to-slate-900 text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-slate-300 text-sm font-medium">Toplam Bakiye</p>
              <p className="text-3xl font-bold mt-2">
                {accounts.reduce((sum, acc) => sum + Number(acc.balance || 0), 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
              </p>
            </div>
            <div className="text-5xl opacity-20">📊</div>
          </div>
        </div>

        {/* New Account Modal */}
        {showNewAccountModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                {newAccountStep === 1 ? 'Yeni Hesap Aç' : 'Hesap Bilgileri'}
              </h2>

              {newAccountStep === 1 ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Hesap Türü
                    </label>
                    <select
                      value={newAccountForm.accountType}
                      onChange={(e) => setNewAccountForm({ ...newAccountForm, accountType: e.target.value })}
                      className="input w-full"
                    >
                      <option value="">Seçiniz</option>
                      <option value="CHECKING">Vadesiz</option>
                      <option value="SAVINGS">Vadeli</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Döviz Cinsi
                    </label>
                    <select
                      value={newAccountForm.currency}
                      onChange={(e) => setNewAccountForm({ ...newAccountForm, currency: e.target.value })}
                      className="input w-full"
                    >
                      <option value="TRY">Türk Lirası (TRY)</option>
                      <option value="USD">Amerikan Doları (USD)</option>
                      <option value="EUR">Euro (EUR)</option>
                      <option value="GBP">İngiliz Sterlini (GBP)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Şube Adı
                    </label>
                    <select
                      value={newAccountForm.branchCode}
                      onChange={(e) => setNewAccountForm({ ...newAccountForm, branchCode: e.target.value })}
                      className="input w-full"
                    >
                      <option value="">Şube seçin (Opsiyonel)</option>
                      <option value="Kadıköy Şubesi">Kadıköy Şubesi</option>
                      <option value="Beşiktaş Şubesi">Beşiktaş Şubesi</option>
                      <option value="Şişli Şubesi">Şişli Şubesi</option>
                      <option value="Beyoğlu Şubesi">Beyoğlu Şubesi</option>
                      <option value="Üsküdar Şubesi">Üsküdar Şubesi</option>
                      <option value="Bakırköy Şubesi">Bakırköy Şubesi</option>
                      <option value="Maltepe Şubesi">Maltepe Şubesi</option>
                      <option value="Kartal Şubesi">Kartal Şubesi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Başlangıç Bakiyesi (Opsiyonel)
                    </label>
                    <input
                      type="number"
                      value={newAccountForm.initialBalance}
                      onChange={(e) => setNewAccountForm({ ...newAccountForm, initialBalance: e.target.value })}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="input w-full"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-4 text-red-600 dark:text-red-400 text-sm">{error}</div>
              )}

              <div className="flex space-x-2 mt-6">
                {newAccountStep === 2 && (
                  <button
                    onClick={() => {
                      setNewAccountStep(1);
                      setError(null);
                    }}
                    className="flex-1 btn-secondary"
                    disabled={creatingAccount}
                  >
                    Geri
                  </button>
                )}
                <button
                  onClick={() => {
                    if (newAccountStep === 1) {
                      setShowNewAccountModal(false);
                    } else {
                      setNewAccountStep(1);
                    }
                    setError(null);
                  }}
                  className="flex-1 btn-secondary"
                  disabled={creatingAccount}
                >
                  İptal
                </button>
                <button
                  onClick={handleCreateAccount}
                  className="flex-1 btn-primary"
                  disabled={creatingAccount}
                >
                  {creatingAccount ? 'Oluşturuluyor...' : newAccountStep === 1 ? 'İleri' : 'Hesap Aç'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Account Detail Modal */}
        {showDetailModal && selectedAccount && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                Hesap Detayları
              </h2>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Hesap Numarası</p>
                  <p className="text-lg font-mono text-slate-900 dark:text-white">
                    {selectedAccount.accountNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Hesap Türü</p>
                  <p className="text-lg text-slate-900 dark:text-white">
                    {getAccountTypeLabel(selectedAccount.accountType)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Döviz Cinsi</p>
                  <p className="text-lg text-slate-900 dark:text-white">
                    {getCurrencyLabel(selectedAccount.currency || 'TRY')} ({selectedAccount.currency || 'TRY'})
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Şube</p>
                  <p className="text-lg text-slate-900 dark:text-white">
                    {selectedAccount.branchCode && selectedAccount.branchName
                      ? `${selectedAccount.branchCode} - ${selectedAccount.branchName}`
                      : selectedAccount.branchCode
                      ? `Şube ${selectedAccount.branchCode}`
                      : 'Belirtilmemiş'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Açılış Tarihi</p>
                  <p className="text-lg text-slate-900 dark:text-white">
                    {new Date(selectedAccount.createdAt).toLocaleDateString('tr-TR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Durum</p>
                  <div className="flex gap-2">
                    {selectedAccount.isActive && !selectedAccount.isFrozen && (
                      <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-medium rounded-full">
                        Aktif
                      </span>
                    )}
                    {selectedAccount.isFrozen && (
                      <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs font-medium rounded-full">
                        Dondurulmuş
                      </span>
                    )}
                    {!selectedAccount.isActive && (
                      <span className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs font-medium rounded-full">
                        Kapalı
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Bakiye</p>
                  <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                    {Number(selectedAccount.balance).toLocaleString('tr-TR', {
                      style: 'currency',
                      currency: selectedAccount.currency || 'TRY',
                    })}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedAccount(null);
                }}
                className="w-full mt-6 btn-primary"
              >
                Kapat
              </button>
            </div>
          </div>
        )}

        {/* Account Action Modal */}
        {showActionModal && selectedAccount && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                Hesap İşlemleri
              </h2>

              <div className="space-y-3 mb-6">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Hesap: {selectedAccount.accountNumber}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Bakiye: {Number(selectedAccount.balance).toLocaleString('tr-TR', {
                    style: 'currency',
                    currency: selectedAccount.currency || 'TRY',
                  })}
                </p>
              </div>

              <div className="space-y-2">
                {selectedAccount.isFrozen ? (
                  <button
                    onClick={() => handleAccountAction('unfreeze')}
                    className="w-full btn-primary"
                  >
                    Hesabı Aç (Dondurmayı Kaldır)
                  </button>
                ) : (
                  <button
                    onClick={() => handleAccountAction('freeze')}
                    className="w-full btn-secondary"
                  >
                    Hesabı Dondur
                  </button>
                )}
                <button
                  onClick={() => handleAccountAction('close')}
                  className="w-full btn-secondary bg-red-600 hover:bg-red-700 text-white"
                >
                  Hesabı Kapat
                </button>
              </div>

              {error && (
                <div className="mt-4 text-red-600 dark:text-red-400 text-sm">{error}</div>
              )}

              <button
                onClick={() => {
                  setShowActionModal(false);
                  setSelectedAccount(null);
                  setError(null);
                }}
                className="w-full mt-4 btn-secondary"
              >
                İptal
              </button>
            </div>
          </div>
        )}

        {/* Close Account Modal with Transfer */}
        {showCloseAccountModal && selectedAccount && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                Hesap Kapatma
              </h2>

              <div className="space-y-4 mb-6">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium mb-2">
                    ⚠️ Hesapta bakiye bulunuyor
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Hesabı kapatmadan önce bakiyeyi başka bir hesaba aktarmanız gerekiyor.
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Kalan Bakiye: <span className="font-bold text-slate-900 dark:text-white">
                      {Number(selectedAccount.balance).toLocaleString('tr-TR', {
                        style: 'currency',
                        currency: selectedAccount.currency || 'TRY',
                      })}
                    </span>
                  </p>
                </div>

                {accounts.filter((acc) => acc.id !== selectedAccount.id && acc.isActive && !acc.isFrozen).length > 0 ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Bakiye Transfer Edilecek Hesap
                    </label>
                    <select
                      value={transferToAccount}
                      onChange={(e) => setTransferToAccount(e.target.value)}
                      className="input w-full"
                    >
                      <option value="">Hesap seçin</option>
                      {accounts
                        .filter((acc) => acc.id !== selectedAccount.id && acc.isActive && !acc.isFrozen)
                        .map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.accountNumber} - {getAccountTypeLabel(acc.accountType)} ({Number(acc.balance).toLocaleString('tr-TR', { style: 'currency', currency: acc.currency || 'TRY' })})
                          </option>
                        ))}
                    </select>
                  </div>
                ) : (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-2">
                      ℹ️ Aktif hesap bulunmuyor
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                      Hesabı kapatmak için önce yeni bir hesap açmanız gerekiyor.
                    </p>
                    <button
                      onClick={() => {
                        setShowCloseAccountModal(false);
                        setShowNewAccountModal(true);
                        setNewAccountStep(1);
                        setNewAccountForm({ accountType: '', currency: 'TRY', branchCode: '', initialBalance: '' });
                      }}
                      className="w-full btn-primary text-sm"
                    >
                      Yeni Hesap Aç
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <div className="mt-4 text-red-600 dark:text-red-400 text-sm">{error}</div>
              )}

              <div className="flex space-x-2 mt-6">
                <button
                  onClick={() => {
                    setShowCloseAccountModal(false);
                    setTransferToAccount('');
                    setError(null);
                  }}
                  className="flex-1 btn-secondary"
                  disabled={closingAccount}
                >
                  İptal
                </button>
                {accounts.filter((acc) => acc.id !== selectedAccount.id && acc.isActive && !acc.isFrozen).length > 0 && (
                  <button
                    onClick={handleCloseAccountWithTransfer}
                    className="flex-1 btn-primary bg-red-600 hover:bg-red-700 text-white"
                    disabled={!transferToAccount || closingAccount}
                  >
                    {closingAccount ? 'İşleniyor...' : 'Transfer Et ve Kapat'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

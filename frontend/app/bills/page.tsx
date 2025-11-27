'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';

const BILLS_STORAGE_KEY = 'user_bills';
const AUTO_PAY_STORAGE_KEY = 'auto_pay_instructions';

export default function BillsPage() {
  const toast = useToast();
  const [bills, setBills] = useState<any[]>([]);
  const [autoPayInstructions, setAutoPayInstructions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [showAutoPayModal, setShowAutoPayModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  
  // Query form states
  const [cities] = useState(['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya']);
  const [selectedCity, setSelectedCity] = useState('İstanbul');
  const [billTypes] = useState([
    { value: 'ELECTRICITY', label: 'Elektrik' },
    { value: 'WATER', label: 'Su' },
    { value: 'GAS', label: 'Doğalgaz' },
    { value: 'INTERNET', label: 'İnternet' },
    { value: 'PHONE', label: 'Telefon' },
    { value: 'TV', label: 'TV' },
  ]);
  const [selectedType, setSelectedType] = useState('ELECTRICITY');
  const [providers, setProviders] = useState<string[]>([]);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [subscriberNumber, setSubscriberNumber] = useState('');
  const [querying, setQuerying] = useState(false);

  // Auto-pay form states
  const [autoPayForm, setAutoPayForm] = useState({
    billId: '',
    accountId: '',
    enabled: true,
  });

  // Load bills from localStorage on mount
  useEffect(() => {
    const savedBills = localStorage.getItem(BILLS_STORAGE_KEY);
    if (savedBills) {
      try {
        const parsedBills = JSON.parse(savedBills);
        setBills(parsedBills);
      } catch (err) {
        console.error('Error loading bills from storage:', err);
      }
    }

    const savedAutoPay = localStorage.getItem(AUTO_PAY_STORAGE_KEY);
    if (savedAutoPay) {
      try {
        const parsedAutoPay = JSON.parse(savedAutoPay);
        setAutoPayInstructions(parsedAutoPay);
      } catch (err) {
        console.error('Error loading auto-pay from storage:', err);
      }
    }
  }, []);

  // Save bills to localStorage whenever bills change
  useEffect(() => {
    if (bills.length > 0) {
      localStorage.setItem(BILLS_STORAGE_KEY, JSON.stringify(bills));
    }
  }, [bills]);

  // Save auto-pay instructions to localStorage
  useEffect(() => {
    if (autoPayInstructions.length > 0) {
      localStorage.setItem(AUTO_PAY_STORAGE_KEY, JSON.stringify(autoPayInstructions));
    }
  }, [autoPayInstructions]);

  useEffect(() => {
    loadAccounts();
    loadProviders();
  }, [selectedCity, selectedType]);

  useEffect(() => {
    if (selectedProvider) {
      setSubscriberNumber('');
    }
  }, [selectedProvider]);

  // Load accounts when pay modal opens
  useEffect(() => {
    if (showPayModal) {
      loadAccounts();
    }
  }, [showPayModal]);

  const loadAccounts = async () => {
    try {
      const accountsResponse = await api.getAccounts();
      const accountsList = (accountsResponse as { accounts?: any[] }).accounts || [];
      setAccounts(accountsList);
      console.log('Loaded accounts for bill payment:', accountsList.length);
    } catch (err: any) {
      console.error('Accounts load error:', err);
      toast.showToast('Hesaplar yüklenirken hata oluştu', 'error');
      setAccounts([]);
    }
  };

  const loadProviders = async () => {
    try {
      const response = await api.getBillProviders(selectedCity, selectedType);
      const providersList = (response as { providers?: string[] }).providers || [];
      setProviders(providersList);
      setSelectedProvider('');
    } catch (err: any) {
      console.error('Providers load error:', err);
      toast.showToast('Şirketler yüklenirken hata oluştu', 'error');
    }
  };

  const handleQueryBill = async () => {
    if (!selectedCity || !selectedType || !selectedProvider || !subscriberNumber) {
      toast.showToast('Lütfen tüm alanları doldurun', 'warning');
      return;
    }

    setQuerying(true);
    try {
      const response = await api.queryBill({
        city: selectedCity,
        type: selectedType,
        provider: selectedProvider,
        subscriberNumber: subscriberNumber.trim(),
      });

      const bill = (response as { bill?: any }).bill;
      if (bill) {
        // Check if bill already exists
        const existingBill = bills.find(b => 
          b.provider === bill.provider && 
          b.subscriberNumber === bill.subscriberNumber &&
          b.type === bill.type
        );

        if (existingBill) {
          // Update existing bill
          const updatedBills = bills.map(b => 
            b.id === existingBill.id ? { ...bill, id: existingBill.id } : b
          );
          setBills(updatedBills);
          toast.showToast('Fatura güncellendi', 'success');
        } else {
          // Add new bill
          const newBills = [...bills, { ...bill, id: bill.id || `bill-${Date.now()}` }];
          setBills(newBills);
          toast.showToast('Fatura sorgulandı', 'success');
        }
        
        setShowQueryModal(false);
        setSubscriberNumber('');
        setSelectedProvider('');
      }
    } catch (err: any) {
      toast.showToast(err.message || 'Fatura sorgulanırken hata oluştu', 'error');
    } finally {
      setQuerying(false);
    }
  };

  const handlePayBill = async () => {
    if (!selectedBill || !selectedAccount) {
      toast.showToast('Lütfen hesap seçin', 'warning');
      return;
    }

    try {
      await api.createTransfer({
        fromAccountId: selectedAccount,
        toAccountIdentifier: `BILL-${selectedBill.provider}-${selectedBill.subscriberNumber}`,
        amount: selectedBill.amount,
        description: `${selectedBill.description} - ${selectedBill.provider}`,
      });

      const updatedBills = bills.map(bill => 
        bill.id === selectedBill.id 
          ? { ...bill, status: 'PAID', paidAt: new Date().toISOString() }
          : bill
      );
      setBills(updatedBills);

      toast.showToast('Fatura başarıyla ödendi', 'success');
      setShowPayModal(false);
      setSelectedBill(null);
      setSelectedAccount('');
    } catch (err: any) {
      toast.showToast(err.message || 'Fatura ödenirken hata oluştu', 'error');
    }
  };

  const handleCreateAutoPay = () => {
    if (!autoPayForm.billId || !autoPayForm.accountId) {
      toast.showToast('Lütfen fatura ve hesap seçin', 'warning');
      return;
    }

    const bill = bills.find(b => b.id === autoPayForm.billId);
    if (!bill) {
      toast.showToast('Fatura bulunamadı', 'error');
      return;
    }

    const newInstruction = {
      id: `autopay-${Date.now()}`,
      billId: autoPayForm.billId,
      bill: bill,
      accountId: autoPayForm.accountId,
      enabled: autoPayForm.enabled,
      createdAt: new Date().toISOString(),
    };

    setAutoPayInstructions([...autoPayInstructions, newInstruction]);
    toast.showToast('Otomatik ödeme talimatı oluşturuldu', 'success');
    setShowAutoPayModal(false);
    setAutoPayForm({ billId: '', accountId: '', enabled: true });
  };

  const handleToggleAutoPay = (instructionId: string) => {
    const updated = autoPayInstructions.map(inst =>
      inst.id === instructionId ? { ...inst, enabled: !inst.enabled } : inst
    );
    setAutoPayInstructions(updated);
    toast.showToast('Otomatik ödeme talimatı güncellendi', 'success');
  };

  const handleDeleteAutoPay = (instructionId: string) => {
    const updated = autoPayInstructions.filter(inst => inst.id !== instructionId);
    setAutoPayInstructions(updated);
    toast.showToast('Otomatik ödeme talimatı silindi', 'success');
  };

  const getBillIcon = (type: string) => {
    const icons: Record<string, string> = {
      ELECTRICITY: '⚡',
      WATER: '💧',
      GAS: '🔥',
      INTERNET: '🌐',
      PHONE: '📞',
      TV: '📺',
    };
    return icons[type] || '📄';
  };

  const getStatusBadge = (status: string) => {
    if (status === 'PAID') {
      return (
        <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-medium rounded-full">
          Ödendi
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs font-medium rounded-full">
        Beklemede
      </span>
    );
  };

  const pendingBills = bills.filter(b => b.status === 'PENDING' || !b.status);
  const totalPending = pendingBills.reduce((sum, bill) => sum + (bill.amount || 0), 0);
  const availableAccounts = accounts.filter((acc) => acc.isActive && !acc.isFrozen);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Faturalar
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Faturalarınızı sorgulayın ve ödeyin
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowAutoPayModal(true)}
              className="btn-secondary"
            >
              Otomatik Ödeme
            </button>
            <button
              onClick={() => setShowQueryModal(true)}
              className="btn-primary"
            >
              + Yeni Fatura Sorgula
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              Toplam Fatura
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {bills.length}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              Bekleyen Fatura
            </p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {pendingBills.length}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              Toplam Tutar
            </p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {totalPending.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
            </p>
          </div>
        </div>

        {/* Auto-Pay Instructions */}
        {autoPayInstructions.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              Otomatik Ödeme Talimatları
            </h2>
            <div className="space-y-3">
              {autoPayInstructions.map((instruction) => {
                const bill = bills.find(b => b.id === instruction.billId) || instruction.bill;
                const account = accounts.find(a => a.id === instruction.accountId);
                return (
                  <div
                    key={instruction.id}
                    className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-xl">
                        {getBillIcon(bill?.type || '')}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {bill?.description || 'Fatura'}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {account ? `${account.accountNumber}` : 'Hesap bulunamadı'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        instruction.enabled
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                      }`}>
                        {instruction.enabled ? 'Aktif' : 'Pasif'}
                      </span>
                      <button
                        onClick={() => handleToggleAutoPay(instruction.id)}
                        className="btn-secondary text-xs"
                      >
                        {instruction.enabled ? 'Pasifleştir' : 'Aktifleştir'}
                      </button>
                      <button
                        onClick={() => handleDeleteAutoPay(instruction.id)}
                        className="btn-secondary text-xs bg-red-600 hover:bg-red-700 text-white"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bills List */}
        <div className="card">
          {bills.length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-6xl mb-4">📄</div>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                Henüz fatura sorgulanmamış
              </p>
              <button
                onClick={() => setShowQueryModal(true)}
                className="btn-primary"
              >
                İlk Faturayı Sorgula
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {bills.map((bill) => {
                const hasAutoPay = autoPayInstructions.some(inst => inst.billId === bill.id && inst.enabled);
                return (
                  <div
                    key={bill.id}
                    className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-2xl">
                        {getBillIcon(bill.type)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-slate-900 dark:text-white">
                            {bill.description}
                          </p>
                          {hasAutoPay && (
                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full">
                              Otomatik
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {bill.provider} - Abone No: {bill.subscriberNumber}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {bill.city} • Son Ödeme: {bill.dueDate ? new Date(bill.dueDate).toLocaleDateString('tr-TR') : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-900 dark:text-white">
                          {bill.amount?.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }) || '0,00 ₺'}
                        </p>
                        {getStatusBadge(bill.status || 'PENDING')}
                      </div>
                      {bill.status !== 'PAID' && (
                        <button
                          onClick={() => {
                            setSelectedBill(bill);
                            setShowPayModal(true);
                            loadAccounts();
                          }}
                          className="btn-primary text-sm"
                        >
                          Öde
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Query Bill Modal */}
        {showQueryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                Fatura Sorgula
              </h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    İl
                  </label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="input w-full"
                  >
                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Fatura Türü
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="input w-full"
                  >
                    {billTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Şirket
                  </label>
                  <select
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value)}
                    className="input w-full"
                    disabled={providers.length === 0}
                  >
                    <option value="">Şirket seçin</option>
                    {providers.map((provider) => (
                      <option key={provider} value={provider}>
                        {provider}
                      </option>
                    ))}
                  </select>
                  {providers.length === 0 && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Yükleniyor...
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Abone Numarası
                  </label>
                  <input
                    type="text"
                    value={subscriberNumber}
                    onChange={(e) => setSubscriberNumber(e.target.value)}
                    placeholder="Abone numaranızı girin"
                    className="input w-full"
                  />
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setShowQueryModal(false);
                    setSubscriberNumber('');
                    setSelectedProvider('');
                  }}
                  className="flex-1 btn-secondary"
                  disabled={querying}
                >
                  İptal
                </button>
                <button
                  onClick={handleQueryBill}
                  className="flex-1 btn-primary"
                  disabled={!selectedProvider || !subscriberNumber || querying}
                >
                  {querying ? 'Sorgulanıyor...' : 'Sorgula'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pay Bill Modal */}
        {showPayModal && selectedBill && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                Fatura Ödeme
              </h2>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Fatura</p>
                  <p className="text-lg font-medium text-slate-900 dark:text-white">
                    {selectedBill.description} - {selectedBill.provider}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Tutar</p>
                  <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {selectedBill.amount?.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }) || '0,00 ₺'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Ödeme Yapılacak Hesap
                  </label>
                  <select
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    className="input w-full"
                  >
                    <option value="">Hesap seçin</option>
                    {accounts.length === 0 ? (
                      <option value="" disabled>Hesaplar yükleniyor...</option>
                    ) : availableAccounts.length === 0 ? (
                      <option value="" disabled>Yeterli bakiyeli aktif hesap bulunmuyor</option>
                    ) : (
                      availableAccounts
                        .filter((acc) => Number(acc.balance || 0) >= (selectedBill.amount || 0))
                        .map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.accountNumber} - {Number(acc.balance || 0).toLocaleString('tr-TR', { style: 'currency', currency: acc.currency || 'TRY' })}
                          </option>
                        ))
                    )}
                  </select>
                  {accounts.length > 0 && availableAccounts.filter((acc) => Number(acc.balance || 0) >= (selectedBill.amount || 0)).length === 0 && (
                    <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
                      Yeterli bakiyeli aktif ve dondurulmamış hesap bulunmuyor.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setShowPayModal(false);
                    setSelectedBill(null);
                    setSelectedAccount('');
                  }}
                  className="flex-1 btn-secondary"
                >
                  İptal
                </button>
                <button
                  onClick={handlePayBill}
                  className="flex-1 btn-primary"
                  disabled={!selectedAccount}
                >
                  Öde
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Auto-Pay Modal */}
        {showAutoPayModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                Otomatik Ödeme Talimatı
              </h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Fatura Seçin
                  </label>
                  <select
                    value={autoPayForm.billId}
                    onChange={(e) => setAutoPayForm({ ...autoPayForm, billId: e.target.value })}
                    className="input w-full"
                  >
                    <option value="">Fatura seçin</option>
                    {pendingBills.map((bill) => (
                      <option key={bill.id} value={bill.id}>
                        {bill.description} - {bill.provider} ({bill.amount?.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Ödeme Yapılacak Hesap
                  </label>
                  <select
                    value={autoPayForm.accountId}
                    onChange={(e) => setAutoPayForm({ ...autoPayForm, accountId: e.target.value })}
                    className="input w-full"
                  >
                    <option value="">Hesap seçin</option>
                    {availableAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.accountNumber} - {Number(acc.balance || 0).toLocaleString('tr-TR', { style: 'currency', currency: acc.currency || 'TRY' })}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={autoPayForm.enabled}
                    onChange={(e) => setAutoPayForm({ ...autoPayForm, enabled: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="enabled" className="text-sm text-slate-700 dark:text-slate-300">
                    Otomatik ödemeyi aktifleştir
                  </label>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setShowAutoPayModal(false);
                    setAutoPayForm({ billId: '', accountId: '', enabled: true });
                  }}
                  className="flex-1 btn-secondary"
                >
                  İptal
                </button>
                <button
                  onClick={handleCreateAutoPay}
                  className="flex-1 btn-primary"
                  disabled={!autoPayForm.billId || !autoPayForm.accountId}
                >
                  Oluştur
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

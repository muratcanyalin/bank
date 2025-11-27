'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';

export default function EmployeePage() {
  const toast = useToast();
  const [customers, setCustomers] = useState<any[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalBalance: 0,
    todayViewed: 0,
    pendingTransactions: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [customersResponse, transactionsResponse] = await Promise.all([
        api.getCustomers().catch(() => ({ customers: [] })),
        api.getTransactions({ status: 'PENDING' }).catch(() => ({ transactions: [] })),
      ]);

      const customersData = (customersResponse as { customers?: any[] }).customers || [];
      setCustomers(customersData);
      setFilteredCustomers(customersData);

      // Calculate stats - use totalBalance from customer object if available, otherwise calculate from accounts
      const totalBalance = customersData.reduce((sum: number, customer: any) => {
        if (customer.totalBalance !== undefined) {
          return sum + Number(customer.totalBalance || 0);
        }
        // Fallback: calculate from accounts if available
        const customerBalance = customer.accounts?.reduce((accSum: number, acc: any) => {
          return accSum + Number(acc.balance || 0);
        }, 0) || 0;
        return sum + customerBalance;
      }, 0);

      setStats({
        totalCustomers: customersData.length,
        totalBalance,
        todayViewed: 0, // TODO: Implement from audit logs
        pendingTransactions: (transactionsResponse as { transactions?: any[] }).transactions?.length || 0,
      });

      // Load recent activities from audit logs (if available)
      // For now, we'll use empty array - can be enhanced with audit log API
      setRecentActivities([]);
    } catch (err: any) {
      console.error('Employee panel load error:', err);
      const errorMsg = err.message || 'Veriler yüklenemedi';
      setError(errorMsg);
      toast.showToast(errorMsg, 'error');
      setCustomers([]);
      setFilteredCustomers([]);
      setRecentActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setFilteredCustomers(customers);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = customers.filter((customer) => {
      const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.toLowerCase();
      const email = customer.email?.toLowerCase() || '';
      const phone = customer.phoneNumber?.toLowerCase() || '';
      const customerId = customer.id?.toLowerCase() || '';
      
      return (
        fullName.includes(query) ||
        email.includes(query) ||
        phone.includes(query) ||
        customerId.includes(query)
      );
    });

    setFilteredCustomers(filtered);
    if (filtered.length === 0) {
      toast.showToast('Arama sonucu bulunamadı', 'info');
    }
  };

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCustomers(customers);
    }
  }, [searchQuery, customers]);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Çalışan Paneli
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Müşteri bilgilerini görüntüleme ve yönetim paneli
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              Toplam Müşteri
            </p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {loading ? '...' : stats.totalCustomers}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              Toplam Bakiye
            </p>
            <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
              {loading ? '...' : stats.totalBalance.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              Bugün Görüntülenen
            </p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {loading ? '...' : stats.todayViewed}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              Bekleyen İşlemler
            </p>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {loading ? '...' : stats.pendingTransactions}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="card">
          <div className="flex space-x-4">
            <input
              type="text"
              placeholder="Müşteri ara (isim, email, telefon, hesap no)..."
              className="flex-1 input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
            <button onClick={handleSearch} className="btn-primary">
              Ara
            </button>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilteredCustomers(customers);
                }}
                className="btn-secondary"
              >
                Temizle
              </button>
            )}
          </div>
        </div>

        {/* Customers List */}
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            Müşteriler
          </h2>
          <div className="card overflow-hidden">
            {loading ? (
              <div className="py-8 text-center">Yükleniyor...</div>
            ) : error ? (
              <div className="py-8 text-center text-red-600">{error}</div>
            ) : filteredCustomers.length === 0 ? (
              <div className="py-8 text-center text-slate-500">
                {searchQuery ? 'Arama sonucu bulunamadı' : 'Henüz müşteri bulunmuyor.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                        Müşteri
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                        İletişim
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                        Hesaplar
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                        Toplam Bakiye
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                        Son Aktivite
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer) => {
                      const accountCount = customer.accountCount || 0;
                      const totalBalance = customer.totalBalance || 0;
                      const lastActivity = customer.createdAt;

                      return (
                        <tr
                          key={customer.id}
                          className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">
                                {customer.firstName} {customer.lastName}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                ID: {customer.id}
                              </p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-sm">
                              <p className="text-slate-900 dark:text-white">
                                {customer.email}
                              </p>
                              <p className="text-slate-500 dark:text-slate-400">
                                {customer.phoneNumber || 'N/A'}
                              </p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 text-xs font-medium rounded">
                              {accountCount} Hesap
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {totalBalance.toLocaleString('tr-TR', {
                                style: 'currency',
                                currency: 'TRY',
                              })}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {lastActivity ? new Date(lastActivity).toLocaleDateString('tr-TR') : 'N/A'}
                            </p>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button className="btn-primary text-sm">
                              Detaylar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        {recentActivities.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              Son Aktiviteler
            </h2>
            <div className="card">
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-700 last:border-0"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                        <span className="text-lg">👁️</span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {activity.action === 'VIEW_CUSTOMER' ? 'Müşteri Görüntülendi' : 'Transfer Onaylandı'}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {activity.customer} - {activity.employee}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {activity.time}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className="card bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-start space-x-3">
            <span className="text-xl">🔒</span>
            <div>
              <p className="font-medium text-red-800 dark:text-red-200">
                Güvenlik Uyarısı
              </p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                Bu panel sadece yetkili çalışanlar içindir. Tüm müşteri bilgilerine erişimler
                audit log sistemine kaydedilmektedir. (Phase 6 - Audit Log System)
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

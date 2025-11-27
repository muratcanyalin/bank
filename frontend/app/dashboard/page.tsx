'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { api } from '@/lib/api';

export default function DashboardPage() {
  const [totalBalance, setTotalBalance] = useState(0);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [balancesResponse, accountsResponse, transactionsResponse] = await Promise.all([
        api.getBalances(),
        api.getAccounts(),
        api.getTransactions({ limit: 3 }),
      ]);

      setTotalBalance(balancesResponse.totalBalance || 0);
      setAccounts(accountsResponse.accounts || []);
      setRecentTransactions(transactionsResponse.transactions || []);
    } catch (error) {
      console.error('Load data error:', error);
      setError('Veriler yüklenirken bir hata oluştu');
      setTotalBalance(0);
      setAccounts([]);
      setRecentTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Hesap özetiniz ve son işlemleriniz
          </p>
        </div>

        {/* Total Balance Card */}
        <div className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-primary-100 text-sm font-medium">Toplam Bakiye</p>
              <p className="text-4xl font-bold mt-2">
                {totalBalance.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
              </p>
            </div>
            <div className="text-5xl opacity-20">💰</div>
          </div>
        </div>

        {/* Accounts Grid */}
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            Hesaplarım
          </h2>
          {loading ? (
            <div className="card">Yükleniyor...</div>
          ) : error ? (
            <div className="card text-red-600">{error}</div>
          ) : accounts.length === 0 ? (
            <div className="card">Henüz hesap bulunmuyor.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map((account) => (
              <div key={account.id} className="card hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {account.name}
                    </p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white mt-1">
                      {account.accountNumber || account.number}
                    </p>
                    {account.branchName && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Şube: {account.branchName}
                      </p>
                    )}
                    {account.branchCode && !account.branchName && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Şube: {account.branchCode}
                      </p>
                    )}
                  </div>
                  <span className="text-2xl">
                    {(account.accountType || account.type) === 'CHECKING' ? '💳' : '🏦'}
                  </span>
                </div>
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {Number(account.balance || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                  </p>
                </div>
              </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            Son İşlemler
          </h2>
          <div className="card">
            {loading ? (
              <div>Yükleniyor...</div>
            ) : error ? (
              <div className="text-red-600">{error}</div>
            ) : recentTransactions.length === 0 ? (
              <div>Henüz işlem bulunmuyor.</div>
            ) : (
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-700 last:border-0"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                      <span className="text-lg">
                        {transaction.type === 'DEPOSIT' ? '⬇️' : transaction.type === 'PAYMENT' ? '💳' : '➡️'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {transaction.description}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {new Date(transaction.createdAt || transaction.date).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  </div>
                  <div className={`text-lg font-semibold ${
                    transaction.amount > 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {transaction.amount > 0 ? '+' : ''}
                    {transaction.amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                  </div>
                </div>
                ))}
              </div>
            )}
            {recentTransactions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <a
                  href="/transactions"
                  className="text-primary-600 dark:text-primary-400 hover:underline text-sm font-medium"
                >
                  Tüm işlemleri görüntüle →
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            Hızlı İşlemler
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a
              href="/transfer"
              className="card hover:shadow-md transition-shadow text-center cursor-pointer"
            >
              <div className="text-4xl mb-2">💸</div>
              <p className="font-medium text-slate-900 dark:text-white">Para Transferi</p>
            </a>
            <a
              href="/accounts"
              className="card hover:shadow-md transition-shadow text-center cursor-pointer"
            >
              <div className="text-4xl mb-2">💳</div>
              <p className="font-medium text-slate-900 dark:text-white">Hesaplarım</p>
            </a>
            <a
              href="/bills"
              className="card hover:shadow-md transition-shadow text-center cursor-pointer"
            >
              <div className="text-4xl mb-2">📱</div>
              <p className="font-medium text-slate-900 dark:text-white">Faturalar</p>
            </a>
            <a
              href="/settings"
              className="card hover:shadow-md transition-shadow text-center cursor-pointer"
            >
              <div className="text-4xl mb-2">⚙️</div>
              <p className="font-medium text-slate-900 dark:text-white">Ayarlar</p>
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
}


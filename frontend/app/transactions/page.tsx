'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { api } from '@/lib/api';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    startDate: '',
    endDate: '',
  });
  
  // Export states
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportData, setExportData] = useState<any[]>([]);
  
  // Receipt states
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, filters]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await api.getTransactions() as { transactions?: any[] };
      setTransactions(response.transactions || []);
      setFilteredTransactions(response.transactions || []);
    } catch (err: any) {
      console.error('Transactions load error:', err);
      setError(err.message || 'İşlemler yüklenemedi');
      setTransactions([]);
      setFilteredTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    if (filters.type) {
      filtered = filtered.filter(t => t.type === filters.type);
    }

    if (filters.status) {
      filtered = filtered.filter(t => t.status === filters.status);
    }

    if (filters.startDate) {
      const start = new Date(filters.startDate);
      filtered = filtered.filter(t => new Date(t.createdAt || t.date) >= start);
    }

    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(t => new Date(t.createdAt || t.date) <= end);
    }

    setFilteredTransactions(filtered);
  };

  const handleFilterApply = () => {
    applyFilters();
    setShowFilterModal(false);
  };

  const handleFilterReset = () => {
    setFilters({
      type: '',
      status: '',
      startDate: '',
      endDate: '',
    });
    setFilteredTransactions(transactions);
    setShowFilterModal(false);
  };

  const handleExport = () => {
    setExportData(filteredTransactions);
    setShowExportModal(true);
  };

  const generatePDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>İşlem Geçmişi - ${new Date().toLocaleDateString('tr-TR')}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #1e293b; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f1f5f9; }
            .positive { color: #16a34a; }
            .negative { color: #dc2626; }
          </style>
        </head>
        <body>
          <h1>İşlem Geçmişi</h1>
          <p>Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}</p>
          <p>Toplam İşlem: ${exportData.length}</p>
          <table>
            <thead>
              <tr>
                <th>Tarih</th>
                <th>İşlem</th>
                <th>Açıklama</th>
                <th>Referans</th>
                <th>Durum</th>
                <th>Tutar</th>
              </tr>
            </thead>
            <tbody>
              ${exportData.map(t => {
                const date = new Date(t.createdAt || t.date);
                return `
                  <tr>
                    <td>${date.toLocaleDateString('tr-TR')} ${date.toLocaleTimeString('tr-TR')}</td>
                    <td>${t.type || 'N/A'}</td>
                    <td>${t.description || 'İşlem'}</td>
                    <td>${t.referenceNumber || 'N/A'}</td>
                    <td>${t.status || 'PENDING'}</td>
                    <td class="${Number(t.amount) > 0 ? 'positive' : 'negative'}">
                      ${Number(t.amount) > 0 ? '+' : ''}${Number(t.amount).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  const generateReceiptPDF = (transaction: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const date = new Date(transaction.createdAt || transaction.date);
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Dekont - ${transaction.referenceNumber || transaction.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #1e293b; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #1e293b; margin: 0; }
            .info { margin: 20px 0; }
            .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
            .info-label { font-weight: bold; color: #64748b; }
            .info-value { color: #1e293b; }
            .amount { text-align: center; margin: 30px 0; padding: 20px; background: #f1f5f9; border-radius: 8px; }
            .amount-value { font-size: 32px; font-weight: bold; color: ${Number(transaction.amount) > 0 ? '#16a34a' : '#dc2626'}; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>İŞLEM DEKONTU</h1>
            <p>Banka İşlem Dekontu</p>
          </div>
          <div class="info">
            <div class="info-row">
              <span class="info-label">İşlem Tarihi:</span>
              <span class="info-value">${date.toLocaleDateString('tr-TR')} ${date.toLocaleTimeString('tr-TR')}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Referans No:</span>
              <span class="info-value">${transaction.referenceNumber || transaction.id}</span>
            </div>
            <div class="info-row">
              <span class="info-label">İşlem Türü:</span>
              <span class="info-value">${transaction.type || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Açıklama:</span>
              <span class="info-value">${transaction.description || 'İşlem'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Durum:</span>
              <span class="info-value">${transaction.status || 'PENDING'}</span>
            </div>
          </div>
          <div class="amount">
            <div style="color: #64748b; font-size: 14px; margin-bottom: 10px;">İşlem Tutarı</div>
            <div class="amount-value">
              ${Number(transaction.amount) > 0 ? '+' : ''}${Number(transaction.amount).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
            </div>
          </div>
          <div class="footer">
            <p>Bu dekont elektronik ortamda oluşturulmuştur.</p>
            <p>Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR')}</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  const getTransactionIcon = (type: string) => {
    const icons: Record<string, string> = {
      DEPOSIT: '⬇️',
      WITHDRAWAL: '⬆️',
      TRANSFER: '➡️',
      PAYMENT: '💳',
    };
    return icons[type] || '💰';
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      COMPLETED: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      PENDING: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
      FAILED: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
      CANCELLED: 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200',
    };
    const labels: Record<string, string> = {
      COMPLETED: 'Tamamlandı',
      PENDING: 'Beklemede',
      FAILED: 'Başarısız',
      CANCELLED: 'İptal Edildi',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || styles.PENDING}`}>
        {labels[status] || status}
      </span>
    );
  };

  // Calculate summary stats
  const totalTransactions = filteredTransactions.length;
  const totalIncoming = filteredTransactions
    .filter((t) => Number(t.amount) > 0)
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalOutgoing = Math.abs(
    filteredTransactions
      .filter((t) => Number(t.amount) < 0)
      .reduce((sum, t) => sum + Number(t.amount), 0)
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              İşlem Geçmişi
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Tüm işlemlerinizin detaylı listesi
            </p>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => setShowFilterModal(true)}
              className="btn-secondary text-sm"
            >
              Filtrele
            </button>
            <button 
              onClick={handleExport}
              className="btn-secondary text-sm"
            >
              Export
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              Toplam İşlem
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {loading ? '...' : totalTransactions}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              Bu Ay Gelen
            </p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {loading ? '...' : totalIncoming.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              Bu Ay Giden
            </p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {loading ? '...' : totalOutgoing.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
            </p>
          </div>
        </div>

        {/* Transactions List */}
        <div className="card">
          {loading ? (
            <div className="py-8 text-center">Yükleniyor...</div>
          ) : error ? (
            <div className="py-8 text-center text-red-600">{error}</div>
          ) : filteredTransactions.length === 0 ? (
            <div className="py-8 text-center text-slate-500">Henüz işlem bulunmuyor.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                      Tarih
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                      İşlem
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                      Referans
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                      Durum
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                      Tutar
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => {
                    const transactionDate = new Date(transaction.createdAt || transaction.date);
                    return (
                      <tr
                        key={transaction.id}
                        className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                              {transactionDate.toLocaleDateString('tr-TR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {transactionDate.toLocaleTimeString('tr-TR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <span className="text-xl">{getTransactionIcon(transaction.type)}</span>
                            <div>
                              <p className="text-sm font-medium text-slate-900 dark:text-white">
                                {transaction.description || 'İşlem'}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                                {transaction.type?.toLowerCase() || 'unknown'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm text-slate-600 dark:text-slate-400 font-mono">
                            {transaction.referenceNumber || 'N/A'}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          {getStatusBadge(transaction.status || 'PENDING')}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <p
                            className={`text-sm font-semibold ${
                              Number(transaction.amount) > 0
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {Number(transaction.amount) > 0 ? '+' : ''}
                            {Number(transaction.amount).toLocaleString('tr-TR', {
                              style: 'currency',
                              currency: 'TRY',
                            })}
                          </p>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedTransaction(transaction);
                              setShowReceiptModal(true);
                            }}
                            className="btn-secondary text-xs px-3 py-1"
                          >
                            Dekont
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

        {/* Filter Modal */}
        {showFilterModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                Filtrele
              </h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    İşlem Türü
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className="input w-full"
                  >
                    <option value="">Tümü</option>
                    <option value="DEPOSIT">Yatırma</option>
                    <option value="WITHDRAWAL">Çekme</option>
                    <option value="TRANSFER">Transfer</option>
                    <option value="PAYMENT">Ödeme</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Durum
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="input w-full"
                  >
                    <option value="">Tümü</option>
                    <option value="COMPLETED">Tamamlandı</option>
                    <option value="PENDING">Beklemede</option>
                    <option value="FAILED">Başarısız</option>
                    <option value="CANCELLED">İptal Edildi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Başlangıç Tarihi
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Bitiş Tarihi
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    className="input w-full"
                  />
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={handleFilterReset}
                  className="flex-1 btn-secondary"
                >
                  Sıfırla
                </button>
                <button
                  onClick={handleFilterApply}
                  className="flex-1 btn-primary"
                >
                  Uygula
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                Export Önizleme
              </h2>

              <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Toplam {exportData.length} işlem export edilecek
                </p>
              </div>

              <div className="mb-6 max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 dark:bg-slate-700 sticky top-0">
                    <tr>
                      <th className="text-left py-2 px-3">Tarih</th>
                      <th className="text-left py-2 px-3">İşlem</th>
                      <th className="text-left py-2 px-3">Açıklama</th>
                      <th className="text-right py-2 px-3">Tutar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exportData.slice(0, 50).map((t) => {
                      const date = new Date(t.createdAt || t.date);
                      return (
                        <tr key={t.id} className="border-b border-slate-200 dark:border-slate-700">
                          <td className="py-2 px-3">{date.toLocaleDateString('tr-TR')}</td>
                          <td className="py-2 px-3">{t.type}</td>
                          <td className="py-2 px-3">{t.description || 'İşlem'}</td>
                          <td className="py-2 px-3 text-right">
                            {Number(t.amount).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {exportData.length > 50 && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center">
                    ... ve {exportData.length - 50} işlem daha
                  </p>
                )}
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="flex-1 btn-secondary"
                >
                  İptal
                </button>
                <button
                  onClick={generatePDF}
                  className="flex-1 btn-primary"
                >
                  PDF Olarak İndir
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Receipt Modal */}
        {showReceiptModal && selectedTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                İşlem Dekontu
              </h2>

              <div className="space-y-4 mb-6">
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Tarih:</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {new Date(selectedTransaction.createdAt || selectedTransaction.date).toLocaleString('tr-TR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Referans No:</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white font-mono">
                      {selectedTransaction.referenceNumber || selectedTransaction.id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">İşlem Türü:</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {selectedTransaction.type || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Açıklama:</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {selectedTransaction.description || 'İşlem'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Durum:</span>
                    {getStatusBadge(selectedTransaction.status || 'PENDING')}
                  </div>
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                    <div className="text-center">
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">İşlem Tutarı</p>
                      <p className={`text-2xl font-bold ${
                        Number(selectedTransaction.amount) > 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {Number(selectedTransaction.amount) > 0 ? '+' : ''}
                        {Number(selectedTransaction.amount).toLocaleString('tr-TR', {
                          style: 'currency',
                          currency: 'TRY',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setShowReceiptModal(false);
                    setSelectedTransaction(null);
                  }}
                  className="flex-1 btn-secondary"
                >
                  Kapat
                </button>
                <button
                  onClick={() => generateReceiptPDF(selectedTransaction)}
                  className="flex-1 btn-primary"
                >
                  PDF İndir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

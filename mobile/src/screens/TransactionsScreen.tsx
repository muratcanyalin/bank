import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { transactionAPI } from '../services/api';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';


export default function TransactionsScreen({ navigation }: any) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, filters]);

  const loadTransactions = async () => {
    try {
      const response = await transactionAPI.list({ limit: 100 });
      setTransactions(response.transactions || []);
      setFilteredTransactions(response.transactions || []);
    } catch (error) {
      console.error('Load transactions error:', error);
      Alert.alert('Hata', 'İşlemler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    if (filters.type) {
      filtered = filtered.filter((t) => t.type === filters.type);
    }

    if (filters.status) {
      filtered = filtered.filter((t) => t.status === filters.status);
    }

    if (filters.startDate) {
      const start = new Date(filters.startDate);
      filtered = filtered.filter(
        (t) => new Date(t.createdAt || t.date) >= start
      );
    }

    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter((t) => new Date(t.createdAt || t.date) <= end);
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

  const generateReceiptPDF = async (transaction: any) => {
    try {
      const date = new Date(transaction.createdAt || transaction.date);
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
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
                <span class="info-value">${date.toLocaleString('tr-TR')}</span>
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
              <p>Oluşturulma Tarihi: ${new Date().toLocaleString('tr-TR')}</p>
            </div>
          </body>
        </html>
      `;

      try {
        const { uri } = await Print.printToFileAsync({ html });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
        } else {
          Alert.alert('Başarılı', 'Dekont oluşturuldu');
        }
      } catch (printError) {
        // Fallback to alert if print fails
        Alert.alert(
          'Dekont',
          `İşlem Dekontu\n\nTarih: ${date.toLocaleString('tr-TR')}\nReferans: ${transaction.referenceNumber || transaction.id}\nTutar: ${Number(transaction.amount).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}`,
          [{ text: 'Tamam' }]
        );
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      Alert.alert('Hata', 'Dekont oluşturulurken bir hata oluştu');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };

  const renderTransaction = ({ item }: any) => {
    const amount = Number(item.amount);
    const isPositive = amount > 0;
    const amountColor = isPositive ? '#10b981' : '#ef4444';

    return (
      <TouchableOpacity
        style={styles.transactionCard}
        onPress={() => {
          setSelectedTransaction(item);
          setShowReceiptModal(true);
        }}
      >
        <View style={styles.transactionHeader}>
          <View style={styles.transactionIcon}>
            <Text style={styles.iconText}>
              {item.type === 'TRANSFER'
                ? '➡️'
                : item.type === 'DEPOSIT'
                ? '⬇️'
                : item.type === 'WITHDRAWAL'
                ? '⬆️'
                : item.type === 'PAYMENT'
                ? '💳'
                : '💰'}
            </Text>
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionDescription}>
              {item.description || item.type || 'İşlem'}
            </Text>
            <Text style={styles.transactionDate}>
              {new Date(item.createdAt || item.date).toLocaleDateString(
                'tr-TR',
                {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }
              )}
            </Text>
          </View>
          <Text style={[styles.transactionAmount, { color: amountColor }]}>
            {isPositive ? '+' : ''}
            {amount.toLocaleString('tr-TR', {
              style: 'currency',
              currency: 'TRY',
            })}
          </Text>
        </View>
        <View style={styles.transactionFooter}>
          <Text style={styles.referenceNumber}>
            Ref: {item.referenceNumber || item.id?.slice(0, 8)}
          </Text>
          <View
            style={[
              styles.statusBadge,
              item.status === 'COMPLETED' && styles.statusCompleted,
              item.status === 'PENDING' && styles.statusPending,
              item.status === 'FAILED' && styles.statusFailed,
            ]}
          >
            <Text style={styles.statusText}>
              {item.status === 'COMPLETED'
                ? 'Tamamlandı'
                : item.status === 'PENDING'
                ? 'Beklemede'
                : item.status === 'FAILED'
                ? 'Başarısız'
                : item.status || 'Beklemede'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>İşlem Geçmişi</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Text style={styles.filterButtonText}>🔍 Filtrele</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {transactions.length === 0
                ? 'Henüz işlem bulunmuyor'
                : 'Filtre sonucu bulunamadı'}
            </Text>
          </View>
        }
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filtrele</Text>
            <ScrollView>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>İşlem Türü</Text>
                <View style={styles.filterOptions}>
                  {['', 'DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'PAYMENT'].map(
                    (type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.filterOption,
                          filters.type === type && styles.filterOptionActive,
                        ]}
                        onPress={() => setFilters({ ...filters, type })}
                      >
                        <Text
                          style={[
                            styles.filterOptionText,
                            filters.type === type &&
                              styles.filterOptionTextActive,
                          ]}
                        >
                          {type === ''
                            ? 'Tümü'
                            : type === 'DEPOSIT'
                            ? 'Yatırma'
                            : type === 'WITHDRAWAL'
                            ? 'Çekme'
                            : type === 'TRANSFER'
                            ? 'Transfer'
                            : 'Ödeme'}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Durum</Text>
                <View style={styles.filterOptions}>
                  {['', 'COMPLETED', 'PENDING', 'FAILED', 'CANCELLED'].map(
                    (status) => (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.filterOption,
                          filters.status === status &&
                            styles.filterOptionActive,
                        ]}
                        onPress={() => setFilters({ ...filters, status })}
                      >
                        <Text
                          style={[
                            styles.filterOptionText,
                            filters.status === status &&
                              styles.filterOptionTextActive,
                          ]}
                        >
                          {status === ''
                            ? 'Tümü'
                            : status === 'COMPLETED'
                            ? 'Tamamlandı'
                            : status === 'PENDING'
                            ? 'Beklemede'
                            : status === 'FAILED'
                            ? 'Başarısız'
                            : 'İptal'}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={handleFilterReset}
              >
                <Text style={styles.modalButtonText}>Sıfırla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleFilterApply}
              >
                <Text
                  style={[
                    styles.modalButtonText,
                    styles.modalButtonTextPrimary,
                  ]}
                >
                  Uygula
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Receipt Modal */}
      <Modal
        visible={showReceiptModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReceiptModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>İşlem Dekontu</Text>
            {selectedTransaction && (
              <ScrollView>
                <View style={styles.receiptInfo}>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Tarih:</Text>
                    <Text style={styles.receiptValue}>
                      {new Date(
                        selectedTransaction.createdAt ||
                          selectedTransaction.date
                      ).toLocaleString('tr-TR')}
                    </Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Referans:</Text>
                    <Text style={styles.receiptValue}>
                      {selectedTransaction.referenceNumber ||
                        selectedTransaction.id}
                    </Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Tür:</Text>
                    <Text style={styles.receiptValue}>
                      {selectedTransaction.type || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Açıklama:</Text>
                    <Text style={styles.receiptValue}>
                      {selectedTransaction.description || 'İşlem'}
                    </Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Durum:</Text>
                    <Text style={styles.receiptValue}>
                      {selectedTransaction.status || 'PENDING'}
                    </Text>
                  </View>
                  <View style={styles.receiptAmount}>
                    <Text style={styles.receiptAmountLabel}>İşlem Tutarı</Text>
                    <Text
                      style={[
                        styles.receiptAmountValue,
                        {
                          color:
                            Number(selectedTransaction.amount) > 0
                              ? '#10b981'
                              : '#ef4444',
                        },
                      ]}
                    >
                      {Number(selectedTransaction.amount) > 0 ? '+' : ''}
                      {Number(selectedTransaction.amount).toLocaleString(
                        'tr-TR',
                        {
                          style: 'currency',
                          currency: 'TRY',
                        }
                      )}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowReceiptModal(false)}
              >
                <Text style={styles.modalButtonText}>Kapat</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={() => {
                  if (selectedTransaction) {
                    generateReceiptPDF(selectedTransaction);
                  }
                }}
              >
                <Text
                  style={[
                    styles.modalButtonText,
                    styles.modalButtonTextPrimary,
                  ]}
                >
                  PDF İndir
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  transactionCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  transactionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  iconText: {
    fontSize: 24,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  referenceNumber: {
    fontSize: 12,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  statusCompleted: {
    backgroundColor: '#d1fae5',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
  },
  statusFailed: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  filterGroup: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterOption: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
    marginBottom: 10,
  },
  filterOptionActive: {
    backgroundColor: '#0ea5e9',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#333',
  },
  filterOptionTextActive: {
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#0ea5e9',
  },
  modalButtonSecondary: {
    backgroundColor: '#f0f0f0',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  modalButtonTextPrimary: {
    color: '#fff',
  },
  receiptInfo: {
    marginBottom: 20,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  receiptLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  receiptValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  receiptAmount: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#f0f9ff',
    borderRadius: 10,
    alignItems: 'center',
  },
  receiptAmountLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  receiptAmountValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
});

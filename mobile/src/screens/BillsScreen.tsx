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
} from 'react-native';
import { billsAPI, accountAPI, transferAPI } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BILLS_STORAGE_KEY = 'user_bills';
const AUTO_PAY_STORAGE_KEY = 'auto_pay_instructions';

export default function BillsScreen({ navigation }: any) {
  const [bills, setBills] = useState<any[]>([]);
  const [autoPayInstructions, setAutoPayInstructions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showAutoPayModal, setShowAutoPayModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [selectedAccount, setSelectedAccount] = useState('');

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

  const [autoPayForm, setAutoPayForm] = useState({
    billId: '',
    accountId: '',
    enabled: true,
  });

  useEffect(() => {
    loadBills();
    loadAutoPay();
    loadAccounts();
  }, []);

  useEffect(() => {
    if (selectedCity && selectedType) {
      loadProviders();
    }
  }, [selectedCity, selectedType]);

  useEffect(() => {
    if (showPayModal) {
      loadAccounts();
    }
  }, [showPayModal]);

  const loadBills = async () => {
    try {
      const savedBills = await AsyncStorage.getItem(BILLS_STORAGE_KEY);
      if (savedBills) {
        setBills(JSON.parse(savedBills));
      }
    } catch (error) {
      console.error('Load bills error:', error);
    }
  };

  const saveBills = async (newBills: any[]) => {
    try {
      await AsyncStorage.setItem(BILLS_STORAGE_KEY, JSON.stringify(newBills));
    } catch (error) {
      console.error('Save bills error:', error);
    }
  };

  const loadAutoPay = async () => {
    try {
      const savedAutoPay = await AsyncStorage.getItem(AUTO_PAY_STORAGE_KEY);
      if (savedAutoPay) {
        setAutoPayInstructions(JSON.parse(savedAutoPay));
      }
    } catch (error) {
      console.error('Load auto-pay error:', error);
    }
  };

  const saveAutoPay = async (instructions: any[]) => {
    try {
      await AsyncStorage.setItem(
        AUTO_PAY_STORAGE_KEY,
        JSON.stringify(instructions)
      );
    } catch (error) {
      console.error('Save auto-pay error:', error);
    }
  };

  const loadAccounts = async () => {
    try {
      const response = await accountAPI.list();
      setAccounts(response.accounts || []);
    } catch (error) {
      console.error('Load accounts error:', error);
    }
  };

  const loadProviders = async () => {
    try {
      const response = await billsAPI.getProviders(selectedCity, selectedType);
      setProviders(response.providers || []);
      setSelectedProvider('');
    } catch (error) {
      console.error('Load providers error:', error);
      Alert.alert('Hata', 'Şirketler yüklenirken hata oluştu');
    }
  };

  const handleQueryBill = async () => {
    if (!selectedCity || !selectedType || !selectedProvider || !subscriberNumber) {
      Alert.alert('Uyarı', 'Lütfen tüm alanları doldurun');
      return;
    }

    setQuerying(true);
    try {
      const response = await billsAPI.query({
        city: selectedCity,
        type: selectedType,
        provider: selectedProvider,
        subscriberNumber: subscriberNumber.trim(),
      });

      const bill = response.bill;
      if (bill) {
        const existingBill = bills.find(
          (b) =>
            b.provider === bill.provider &&
            b.subscriberNumber === bill.subscriberNumber &&
            b.type === bill.type
        );

        let updatedBills;
        if (existingBill) {
          updatedBills = bills.map((b) =>
            b.id === existingBill.id ? { ...bill, id: existingBill.id } : b
          );
        } else {
          updatedBills = [
            ...bills,
            { ...bill, id: bill.id || `bill-${Date.now()}` },
          ];
        }

        setBills(updatedBills);
        await saveBills(updatedBills);
        Alert.alert('Başarılı', 'Fatura sorgulandı');
        setShowQueryModal(false);
        setSubscriberNumber('');
        setSelectedProvider('');
      }
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Fatura sorgulanırken hata oluştu');
    } finally {
      setQuerying(false);
    }
  };

  const handlePayBill = async () => {
    if (!selectedBill || !selectedAccount) {
      Alert.alert('Uyarı', 'Lütfen hesap seçin');
      return;
    }

    try {
      await transferAPI.create({
        fromAccountId: selectedAccount,
        toAccountIdentifier: `BILL-${selectedBill.provider}-${selectedBill.subscriberNumber}`,
        amount: selectedBill.amount,
        description: `${selectedBill.description} - ${selectedBill.provider}`,
      });

      const updatedBills = bills.map((bill) =>
        bill.id === selectedBill.id
          ? { ...bill, status: 'PAID', paidAt: new Date().toISOString() }
          : bill
      );
      setBills(updatedBills);
      await saveBills(updatedBills);

      Alert.alert('Başarılı', 'Fatura başarıyla ödendi');
      setShowPayModal(false);
      setSelectedBill(null);
      setSelectedAccount('');
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Fatura ödenirken hata oluştu');
    }
  };

  const handleCreateAutoPay = () => {
    if (!autoPayForm.billId || !autoPayForm.accountId) {
      Alert.alert('Uyarı', 'Lütfen fatura ve hesap seçin');
      return;
    }

    const bill = bills.find((b) => b.id === autoPayForm.billId);
    if (!bill) {
      Alert.alert('Hata', 'Fatura bulunamadı');
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

    const updated = [...autoPayInstructions, newInstruction];
    setAutoPayInstructions(updated);
    saveAutoPay(updated);
    Alert.alert('Başarılı', 'Otomatik ödeme talimatı oluşturuldu');
    setShowAutoPayModal(false);
    setAutoPayForm({ billId: '', accountId: '', enabled: true });
  };

  const handleToggleAutoPay = (instructionId: string) => {
    const updated = autoPayInstructions.map((inst) =>
      inst.id === instructionId ? { ...inst, enabled: !inst.enabled } : inst
    );
    setAutoPayInstructions(updated);
    saveAutoPay(updated);
    Alert.alert('Başarılı', 'Otomatik ödeme talimatı güncellendi');
  };

  const handleDeleteAutoPay = (instructionId: string) => {
    const updated = autoPayInstructions.filter(
      (inst) => inst.id !== instructionId
    );
    setAutoPayInstructions(updated);
    saveAutoPay(updated);
    Alert.alert('Başarılı', 'Otomatik ödeme talimatı silindi');
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
        <View style={[styles.statusBadge, styles.statusPaid]}>
          <Text style={styles.statusText}>Ödendi</Text>
        </View>
      );
    }
    return (
      <View style={[styles.statusBadge, styles.statusPending]}>
        <Text style={styles.statusText}>Beklemede</Text>
      </View>
    );
  };

  const pendingBills = bills.filter((b) => b.status === 'PENDING' || !b.status);
  const availableAccounts = accounts.filter(
    (acc) => acc.isActive && !acc.isFrozen
  );

  const renderBill = ({ item }: any) => {
    const hasAutoPay = autoPayInstructions.some(
      (inst) => inst.billId === item.id && inst.enabled
    );

    return (
      <View style={styles.billCard}>
        <View style={styles.billHeader}>
          <View style={styles.billIcon}>
            <Text style={styles.billIconText}>{getBillIcon(item.type)}</Text>
          </View>
          <View style={styles.billInfo}>
            <View style={styles.billTitleRow}>
              <Text style={styles.billTitle}>{item.description}</Text>
              {hasAutoPay && (
                <View style={styles.autoPayBadge}>
                  <Text style={styles.autoPayBadgeText}>Otomatik</Text>
                </View>
              )}
            </View>
            <Text style={styles.billProvider}>
              {item.provider} - Abone No: {item.subscriberNumber}
            </Text>
            <Text style={styles.billCity}>
              {item.city} • Son Ödeme:{' '}
              {item.dueDate
                ? new Date(item.dueDate).toLocaleDateString('tr-TR')
                : 'N/A'}
            </Text>
          </View>
        </View>
        <View style={styles.billFooter}>
          <View>
            <Text style={styles.billAmount}>
              {item.amount?.toLocaleString('tr-TR', {
                style: 'currency',
                currency: 'TRY',
              }) || '0,00 ₺'}
            </Text>
            {getStatusBadge(item.status || 'PENDING')}
          </View>
          {item.status !== 'PAID' && (
            <TouchableOpacity
              style={styles.payButton}
              onPress={() => {
                setSelectedBill(item);
                setShowPayModal(true);
                loadAccounts();
              }}
            >
              <Text style={styles.payButtonText}>Öde</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Faturalar</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowAutoPayModal(true)}
          >
            <Text style={styles.headerButtonText}>Otomatik</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, styles.headerButtonPrimary]}
            onPress={() => setShowQueryModal(true)}
          >
            <Text
              style={[
                styles.headerButtonText,
                styles.headerButtonTextPrimary,
              ]}
            >
              + Sorgula
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {autoPayInstructions.length > 0 && (
        <View style={styles.autoPaySection}>
          <Text style={styles.sectionTitle}>Otomatik Ödeme Talimatları</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {autoPayInstructions.map((instruction) => {
              const bill =
                bills.find((b) => b.id === instruction.billId) ||
                instruction.bill;
              const account = accounts.find((a) => a.id === instruction.accountId);
              return (
                <View key={instruction.id} style={styles.autoPayCard}>
                  <Text style={styles.autoPayBillName}>
                    {bill?.description || 'Fatura'}
                  </Text>
                  <Text style={styles.autoPayAccount}>
                    {account ? account.accountNumber : 'Hesap bulunamadı'}
                  </Text>
                  <View style={styles.autoPayActions}>
                    <TouchableOpacity
                      style={styles.autoPayToggle}
                      onPress={() => handleToggleAutoPay(instruction.id)}
                    >
                      <Text style={styles.autoPayToggleText}>
                        {instruction.enabled ? 'Aktif' : 'Pasif'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.autoPayDelete}
                      onPress={() => handleDeleteAutoPay(instruction.id)}
                    >
                      <Text style={styles.autoPayDeleteText}>Sil</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      <FlatList
        data={bills}
        renderItem={renderBill}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadBills} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Henüz fatura sorgulanmamış</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setShowQueryModal(true)}
            >
              <Text style={styles.emptyButtonText}>İlk Faturayı Sorgula</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Query Modal */}
      <Modal
        visible={showQueryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowQueryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Fatura Sorgula</Text>
            <ScrollView>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>İl</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.optionsRow}>
                    {cities.map((city) => (
                      <TouchableOpacity
                        key={city}
                        style={[
                          styles.optionButton,
                          selectedCity === city && styles.optionButtonActive,
                        ]}
                        onPress={() => setSelectedCity(city)}
                      >
                        <Text
                          style={[
                            styles.optionButtonText,
                            selectedCity === city &&
                              styles.optionButtonTextActive,
                          ]}
                        >
                          {city}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Fatura Türü</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.optionsRow}>
                    {billTypes.map((type) => (
                      <TouchableOpacity
                        key={type.value}
                        style={[
                          styles.optionButton,
                          selectedType === type.value &&
                            styles.optionButtonActive,
                        ]}
                        onPress={() => setSelectedType(type.value)}
                      >
                        <Text
                          style={[
                            styles.optionButtonText,
                            selectedType === type.value &&
                              styles.optionButtonTextActive,
                          ]}
                        >
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Şirket</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.optionsRow}>
                    {providers.map((provider) => (
                      <TouchableOpacity
                        key={provider}
                        style={[
                          styles.optionButton,
                          selectedProvider === provider &&
                            styles.optionButtonActive,
                        ]}
                        onPress={() => setSelectedProvider(provider)}
                      >
                        <Text
                          style={[
                            styles.optionButtonText,
                            selectedProvider === provider &&
                              styles.optionButtonTextActive,
                          ]}
                        >
                          {provider}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
                {providers.length === 0 && (
                  <Text style={styles.loadingText}>Yükleniyor...</Text>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Abone Numarası</Text>
                <TextInput
                  style={styles.input}
                  value={subscriberNumber}
                  onChangeText={setSubscriberNumber}
                  placeholder="Abone numaranızı girin"
                  keyboardType="numeric"
                />
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => {
                  setShowQueryModal(false);
                  setSubscriberNumber('');
                  setSelectedProvider('');
                }}
                disabled={querying}
              >
                <Text style={styles.modalButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleQueryBill}
                disabled={
                  !selectedProvider || !subscriberNumber || querying
                }
              >
                <Text
                  style={[
                    styles.modalButtonText,
                    styles.modalButtonTextPrimary,
                  ]}
                >
                  {querying ? 'Sorgulanıyor...' : 'Sorgula'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Pay Modal */}
      <Modal
        visible={showPayModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPayModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Fatura Ödeme</Text>
            {selectedBill && (
              <ScrollView>
                <View style={styles.payInfo}>
                  <Text style={styles.payInfoLabel}>Fatura</Text>
                  <Text style={styles.payInfoValue}>
                    {selectedBill.description} - {selectedBill.provider}
                  </Text>
                </View>
                <View style={styles.payInfo}>
                  <Text style={styles.payInfoLabel}>Tutar</Text>
                  <Text style={styles.payAmount}>
                    {selectedBill.amount?.toLocaleString('tr-TR', {
                      style: 'currency',
                      currency: 'TRY',
                    }) || '0,00 ₺'}
                  </Text>
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Ödeme Yapılacak Hesap</Text>
                  <ScrollView>
                    {availableAccounts
                      .filter(
                        (acc) =>
                          Number(acc.balance || 0) >=
                          (selectedBill.amount || 0)
                      )
                      .map((acc) => (
                        <TouchableOpacity
                          key={acc.id}
                          style={[
                            styles.accountOption,
                            selectedAccount === acc.id &&
                              styles.accountOptionActive,
                          ]}
                          onPress={() => setSelectedAccount(acc.id)}
                        >
                          <Text
                            style={[
                              styles.accountOptionText,
                              selectedAccount === acc.id &&
                                styles.accountOptionTextActive,
                            ]}
                          >
                            {acc.accountNumber} -{' '}
                            {Number(acc.balance || 0).toLocaleString('tr-TR', {
                              style: 'currency',
                              currency: acc.currency || 'TRY',
                            })}
                          </Text>
                        </TouchableOpacity>
                      ))}
                  </ScrollView>
                </View>
              </ScrollView>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => {
                  setShowPayModal(false);
                  setSelectedBill(null);
                  setSelectedAccount('');
                }}
              >
                <Text style={styles.modalButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonPrimary,
                  !selectedAccount && styles.modalButtonDisabled,
                ]}
                onPress={handlePayBill}
                disabled={!selectedAccount}
              >
                <Text
                  style={[
                    styles.modalButtonText,
                    styles.modalButtonTextPrimary,
                  ]}
                >
                  Öde
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Auto-Pay Modal */}
      <Modal
        visible={showAutoPayModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAutoPayModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Otomatik Ödeme Talimatı</Text>
            <ScrollView>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Fatura Seçin</Text>
                <ScrollView>
                  {pendingBills.map((bill) => (
                    <TouchableOpacity
                      key={bill.id}
                      style={[
                        styles.accountOption,
                        autoPayForm.billId === bill.id &&
                          styles.accountOptionActive,
                      ]}
                      onPress={() =>
                        setAutoPayForm({ ...autoPayForm, billId: bill.id })
                      }
                    >
                      <Text
                        style={[
                          styles.accountOptionText,
                          autoPayForm.billId === bill.id &&
                            styles.accountOptionTextActive,
                        ]}
                      >
                        {bill.description} - {bill.provider} (
                        {bill.amount?.toLocaleString('tr-TR', {
                          style: 'currency',
                          currency: 'TRY',
                        })}
                        )
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Ödeme Yapılacak Hesap</Text>
                <ScrollView>
                  {availableAccounts.map((acc) => (
                    <TouchableOpacity
                      key={acc.id}
                      style={[
                        styles.accountOption,
                        autoPayForm.accountId === acc.id &&
                          styles.accountOptionActive,
                      ]}
                      onPress={() =>
                        setAutoPayForm({ ...autoPayForm, accountId: acc.id })
                      }
                    >
                      <Text
                        style={[
                          styles.accountOptionText,
                          autoPayForm.accountId === acc.id &&
                            styles.accountOptionTextActive,
                        ]}
                      >
                        {acc.accountNumber} -{' '}
                        {Number(acc.balance || 0).toLocaleString('tr-TR', {
                          style: 'currency',
                          currency: acc.currency || 'TRY',
                        })}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => {
                  setShowAutoPayModal(false);
                  setAutoPayForm({ billId: '', accountId: '', enabled: true });
                }}
              >
                <Text style={styles.modalButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonPrimary,
                  (!autoPayForm.billId || !autoPayForm.accountId) &&
                    styles.modalButtonDisabled,
                ]}
                onPress={handleCreateAutoPay}
                disabled={!autoPayForm.billId || !autoPayForm.accountId}
              >
                <Text
                  style={[
                    styles.modalButtonText,
                    styles.modalButtonTextPrimary,
                  ]}
                >
                  Oluştur
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
    gap: 10,
  },
  headerButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  headerButtonPrimary: {
    backgroundColor: '#0ea5e9',
  },
  headerButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  headerButtonTextPrimary: {
    color: '#fff',
  },
  autoPaySection: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  autoPayCard: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
    minWidth: 150,
  },
  autoPayBillName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  autoPayAccount: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  autoPayActions: {
    flexDirection: 'row',
    gap: 5,
  },
  autoPayToggle: {
    flex: 1,
    padding: 6,
    backgroundColor: '#0ea5e9',
    borderRadius: 6,
    alignItems: 'center',
  },
  autoPayToggleText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  autoPayDelete: {
    flex: 1,
    padding: 6,
    backgroundColor: '#ef4444',
    borderRadius: 6,
    alignItems: 'center',
  },
  autoPayDeleteText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  billCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  billHeader: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  billIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  billIconText: {
    fontSize: 24,
  },
  billInfo: {
    flex: 1,
  },
  billTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  billTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  autoPayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    marginLeft: 8,
  },
  autoPayBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500',
  },
  billProvider: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  billCity: {
    fontSize: 12,
    color: '#999',
  },
  billFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  billAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusPaid: {
    backgroundColor: '#d1fae5',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  payButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#0ea5e9',
    borderRadius: 8,
  },
  payButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  emptyButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#0ea5e9',
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
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
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  optionButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  optionButtonActive: {
    backgroundColor: '#0ea5e9',
  },
  optionButtonText: {
    fontSize: 14,
    color: '#333',
  },
  optionButtonTextActive: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  payInfo: {
    marginBottom: 20,
  },
  payInfoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  payInfoValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  payAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
  accountOption: {
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginBottom: 10,
  },
  accountOptionActive: {
    backgroundColor: '#0ea5e9',
  },
  accountOptionText: {
    fontSize: 14,
    color: '#333',
  },
  accountOptionTextActive: {
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
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  modalButtonTextPrimary: {
    color: '#fff',
  },
});


import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { accountAPI, transferAPI } from '../services/api';

export default function TransferScreen({ navigation }: any) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const response = await accountAPI.list();
      setAccounts(response.accounts || []);
      if (response.accounts?.length > 0) {
        setFromAccountId(response.accounts[0].id);
      }
    } catch (error) {
      console.error('Load accounts error:', error);
      Alert.alert('Hata', 'Hesaplar yüklenemedi');
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleTransfer = async () => {
    if (!fromAccountId || !toAccountId || !amount) {
      Alert.alert('Hata', 'Tüm alanları doldurun');
      return;
    }

    const transferAmount = parseFloat(amount);
    if (transferAmount <= 0) {
      Alert.alert('Hata', 'Tutar 0\'dan büyük olmalıdır');
      return;
    }

    setLoading(true);
    try {
      await transferAPI.create({
        fromAccountId,
        toAccountId,
        amount: transferAmount,
        description: description || undefined,
      });

      Alert.alert('Başarılı', 'Transfer işlemi tamamlandı', [
        {
          text: 'Tamam',
          onPress: () => {
            navigation.goBack();
            // Refresh dashboard
            navigation.navigate('Dashboard');
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert(
        'Transfer Hatası',
        error.response?.data?.message || 'Transfer işlemi başarısız oldu'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingAccounts) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Para Transferi</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Gönderen Hesap</Text>
        <View style={styles.accountSelector}>
          {accounts.map((account) => (
            <TouchableOpacity
              key={account.id}
              style={[
                styles.accountOption,
                fromAccountId === account.id && styles.accountOptionSelected,
              ]}
              onPress={() => setFromAccountId(account.id)}
            >
              <Text style={styles.accountOptionText}>
                {account.accountType} - ****{account.accountNumber.slice(-4)}
              </Text>
              <Text style={styles.accountBalance}>
                {Number(account.balance).toLocaleString('tr-TR', {
                  style: 'currency',
                  currency: 'TRY',
                })}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Alıcı Hesap / IBAN</Text>
        <TextInput
          style={styles.input}
          placeholder="TR00 0000 0000 0000 0000 0000 00"
          value={toAccountId}
          onChangeText={setToAccountId}
        />

        <Text style={styles.label}>Tutar (TRY)</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Açıklama (Opsiyonel)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Transfer açıklaması..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleTransfer}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Transfer Et</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
  },
  accountSelector: {
    marginBottom: 10,
  },
  accountOption: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  accountOptionSelected: {
    borderColor: '#0ea5e9',
    backgroundColor: '#f0f9ff',
  },
  accountOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  accountBalance: {
    fontSize: 14,
    color: '#0ea5e9',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 10,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#0ea5e9',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});



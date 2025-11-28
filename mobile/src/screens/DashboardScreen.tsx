import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { balanceAPI, accountAPI } from '../services/api';

export default function DashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [accountsResponse, balancesResponse] = await Promise.all([
        accountAPI.list(),
        balanceAPI.getAll(),
      ]);

      setAccounts(accountsResponse.accounts || []);
      setTotalBalance(balancesResponse.totalBalance || 0);
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Merhaba, {user?.firstName} {user?.lastName}
        </Text>
        <Text style={styles.subtitle}>Hesap Özetiniz</Text>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Toplam Bakiye</Text>
        <Text style={styles.balanceAmount}>
          {totalBalance.toLocaleString('tr-TR', {
            style: 'currency',
            currency: 'TRY',
          })}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hesaplarım</Text>
        {accounts.map((account) => (
          <TouchableOpacity
            key={account.id}
            style={styles.accountCard}
            onPress={() =>
              navigation.navigate('AccountDetail', { accountId: account.id })
            }
          >
            <View style={styles.accountHeader}>
              <View style={styles.accountInfo}>
                <Text style={styles.accountName}>
                  {account.accountType === 'CHECKING'
                    ? '💳 Vadesiz'
                    : account.accountType === 'SAVINGS'
                    ? '🏦 Vadeli'
                    : '💳 Kredi'}
                </Text>
                <Text style={styles.accountNumber}>
                  ****{account.accountNumber.slice(-4)}
                </Text>
                {account.branchName && (
                  <Text style={styles.branchInfo}>
                    Şube: {account.branchName}
                  </Text>
                )}
                {account.branchCode && !account.branchName && (
                  <Text style={styles.branchInfo}>
                    Şube: {account.branchCode}
                  </Text>
                )}
              </View>
            </View>
            <Text style={styles.accountBalance}>
              {Number(account.balance).toLocaleString('tr-TR', {
                style: 'currency',
                currency: 'TRY',
              })}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Transfer')}
          >
            <Text style={styles.actionIcon}>💸</Text>
            <Text style={styles.actionText}>Transfer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Transactions')}
          >
            <Text style={styles.actionIcon}>📜</Text>
            <Text style={styles.actionText}>İşlemler</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Bills')}
          >
            <Text style={styles.actionIcon}>📄</Text>
            <Text style={styles.actionText}>Faturalar</Text>
          </TouchableOpacity>
        </View>
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
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  balanceCard: {
    backgroundColor: '#0ea5e9',
    margin: 20,
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
  },
  balanceLabel: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 10,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  accountCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  accountNumber: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  branchInfo: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  accountBalance: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
  quickActions: {
    padding: 20,
    paddingTop: 0,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: 100,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
});



import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { transactionAPI } from '../services/api';

export default function TransactionsScreen({ navigation }: any) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const response = await transactionAPI.list({ limit: 50 });
      setTransactions(response.transactions || []);
    } catch (error) {
      console.error('Load transactions error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };

  const renderTransaction = ({ item }: any) => {
    const isOutgoing = item.direction === 'outgoing';
    const amountColor = isOutgoing ? '#ef4444' : '#10b981';

    return (
      <TouchableOpacity
        style={styles.transactionCard}
        onPress={() =>
          navigation.navigate('TransactionDetail', { transactionId: item.id })
        }
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
                : '💳'}
            </Text>
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionDescription}>
              {item.description || item.type}
            </Text>
            <Text style={styles.transactionDate}>
              {new Date(item.createdAt).toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <Text style={[styles.transactionAmount, { color: amountColor }]}>
            {isOutgoing ? '-' : '+'}
            {Number(item.amount).toLocaleString('tr-TR', {
              style: 'currency',
              currency: 'TRY',
            })}
          </Text>
        </View>
        <View style={styles.transactionFooter}>
          <Text style={styles.referenceNumber}>
            Ref: {item.referenceNumber}
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
                : item.status}
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
      </View>

      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Henüz işlem bulunmuyor</Text>
          </View>
        }
      />
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
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
    fontFamily: 'monospace',
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
});



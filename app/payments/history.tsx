import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { paymentService, type PaymentData } from '../../lib/payment-service';
import { formatCurrency } from '../../lib/stripe';

// Mock company ID - in real app, get from auth context
const MOCK_COMPANY_ID = 'company-123';

export default function PaymentHistoryScreen() {
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'succeeded' | 'failed' | 'pending'>('all');

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const paymentsData = await paymentService.getCompanyPayments(MOCK_COMPANY_ID, 100);
      setPayments(paymentsData);
    } catch (error) {
      console.error('Failed to load payments:', error);
      Alert.alert('Fel', 'Kunde inte ladda betalningshistorik');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPayments();
    setRefreshing(false);
  };

  const getFilteredPayments = () => {
    if (filter === 'all') return payments;
    return payments.filter(payment => payment.status === filter);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded':
        return '#4CAF50';
      case 'failed':
        return '#FF3B30';
      case 'pending':
        return '#FF9800';
      case 'canceled':
        return '#666';
      default:
        return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'Genomförd';
      case 'failed':
        return 'Misslyckad';
      case 'pending':
        return 'Pågående';
      case 'canceled':
        return 'Avbruten';
      default:
        return status;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'card':
        return 'card';
      case 'apple_pay':
        return 'logo-apple';
      case 'google_pay':
        return 'logo-google';
      default:
        return 'card';
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'card':
        return 'Kort';
      case 'apple_pay':
        return 'Apple Pay';
      case 'google_pay':
        return 'Google Pay';
      default:
        return method;
    }
  };

  const handleExport = async (format: 'csv' | 'json' | 'pdf') => {
    try {
      setExporting(true);
      const exportData = await paymentService.exportPaymentData(
        MOCK_COMPANY_ID,
        format
      );

      if (format === 'csv' || format === 'json') {
        // Share the data
        await Share.share({
          message: exportData,
          title: `Betalningshistorik.${format}`,
        });
      } else {
        Alert.alert('Export klar', 'PDF-rapporten har genererats');
      }
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Fel', 'Kunde inte exportera data');
    } finally {
      setExporting(false);
    }
  };

  const showExportOptions = () => {
    Alert.alert(
      'Exportera betalningshistorik',
      'Välj format för export',
      [
        { text: 'Avbryt', style: 'cancel' },
        { text: 'CSV', onPress: () => handleExport('csv') },
        { text: 'JSON', onPress: () => handleExport('json') },
        { text: 'PDF', onPress: () => handleExport('pdf') },
      ]
    );
  };

  const filteredPayments = getFilteredPayments();
  const totalAmount = filteredPayments
    .filter(p => p.status === 'succeeded')
    .reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Laddar betalningshistorik...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Betalningshistorik</Text>
        <TouchableOpacity 
          onPress={showExportOptions} 
          style={styles.exportButton}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Ionicons name="download" size={24} color="#007AFF" />
          )}
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Totalt belopp (genomförda)</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(totalAmount, 'SEK')}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Antal betalningar</Text>
          <Text style={styles.summaryValue}>{filteredPayments.length}</Text>
        </View>
      </View>

      {/* Filter Buttons */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {[
          { key: 'all', label: 'Alla', count: payments.length },
          { key: 'succeeded', label: 'Genomförda', count: payments.filter(p => p.status === 'succeeded').length },
          { key: 'pending', label: 'Pågående', count: payments.filter(p => p.status === 'pending').length },
          { key: 'failed', label: 'Misslyckade', count: payments.filter(p => p.status === 'failed').length },
        ].map((filterOption) => (
          <TouchableOpacity
            key={filterOption.key}
            style={[
              styles.filterButton,
              filter === filterOption.key && styles.filterButtonActive,
            ]}
            onPress={() => setFilter(filterOption.key as any)}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === filterOption.key && styles.filterButtonTextActive,
              ]}
            >
              {filterOption.label} ({filterOption.count})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Payments List */}
      <ScrollView
        style={styles.paymentsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {filteredPayments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="card-outline" size={48} color="#CCC" />
            <Text style={styles.emptyText}>Inga betalningar att visa</Text>
          </View>
        ) : (
          filteredPayments.map((payment) => (
            <View key={payment.id} style={styles.paymentCard}>
              <View style={styles.paymentHeader}>
                <View style={styles.paymentMethod}>
                  <Ionicons
                    name={getPaymentMethodIcon(payment.paymentMethod) as any}
                    size={20}
                    color="#007AFF"
                  />
                  <Text style={styles.paymentMethodText}>
                    {getPaymentMethodText(payment.paymentMethod)}
                  </Text>
                </View>
                <View style={styles.paymentAmount}>
                  <Text style={styles.amountText}>
                    {formatCurrency(payment.amount, payment.currency)}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(payment.status) },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {getStatusText(payment.status)}
                    </Text>
                  </View>
                </View>
              </View>

              {payment.description && (
                <Text style={styles.paymentDescription}>
                  {payment.description}
                </Text>
              )}

              <View style={styles.paymentFooter}>
                <Text style={styles.paymentDate}>
                  {new Date(payment.createdAt).toLocaleDateString('sv-SE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
                <Text style={styles.paymentId}>ID: {payment.id.slice(-8)}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  exportButton: {
    padding: 4,
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  paymentsList: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
  paymentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethodText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  paymentAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  paymentDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  paymentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  paymentDate: {
    fontSize: 12,
    color: '#666',
  },
  paymentId: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },
});
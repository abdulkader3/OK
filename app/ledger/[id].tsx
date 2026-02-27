import { BorderRadius, Colors, FontSize, FontWeight, Shadow, Spacing } from '@/constants/theme';
import { getLedgerById, Ledger } from '@/services/ledgerService';
import { getPayments, Payment } from '@/services/paymentService';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LedgerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [ledgerData, paymentsData] = await Promise.all([
        getLedgerById(id),
        getPayments(id),
      ]);
      setLedger(ledgerData);
      setPayments(paymentsData.payments || []);
    } catch (error) {
      console.error('Error fetching ledger:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primaryMuted} />
        </View>
      </SafeAreaView>
    );
  }

  if (!ledger) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Ledger not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ledger Details</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <MaterialIcons name="more-vert" size={24} color={Colors.light.text} />
          </TouchableOpacity>
        </View>

        {/* Ledger Summary Card */}
        <View style={[styles.summaryCard, Shadow.md]}>
          <View style={styles.summaryHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {ledger.counterpartyName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </Text>
            </View>
            <View style={styles.summaryInfo}>
              <Text style={styles.counterpartyName}>{ledger.counterpartyName}</Text>
              <View style={[styles.typeBadge, ledger.type === 'owes_me' ? styles.typeBadgeOwes : styles.typeBadgeOwe]}>
                <MaterialIcons
                  name={ledger.type === 'owes_me' ? 'arrow-upward' : 'arrow-downward'}
                  size={14}
                  color={ledger.type === 'owes_me' ? Colors.light.accentTeal : Colors.light.accentOrange}
                />
                <Text style={[styles.typeText, ledger.type === 'owes_me' ? styles.typeTextOwes : styles.typeTextOwe]}>
                  {ledger.type === 'owes_me' ? 'They owe me' : 'I owe them'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.amountRow}>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Initial</Text>
              <Text style={styles.amountValue}>${ledger.initialAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Outstanding</Text>
              <Text style={[styles.amountValue, styles.outstandingAmount]}>
                ${ledger.outstandingBalance.toFixed(2)}
              </Text>
            </View>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Due Date</Text>
              <Text style={styles.amountValue}>
                {ledger.dueDate ? formatDate(ledger.dueDate) : 'N/A'}
              </Text>
            </View>
          </View>

          {ledger.notes && (
            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>Notes</Text>
              <Text style={styles.notesText}>{ledger.notes}</Text>
            </View>
          )}
        </View>

        {/* Record Payment Button */}
        {ledger.outstandingBalance > 0 && (
          <TouchableOpacity
            style={[styles.recordPaymentBtn, Shadow.sm]}
            activeOpacity={0.8}
            onPress={() => router.push({ pathname: '/modal', params: { ledgerId: ledger._id, outstandingBalance: ledger.outstandingBalance } })}
          >
            <MaterialIcons name="add" size={20} color={Colors.light.textInverse} />
            <Text style={styles.recordPaymentText}>Record Payment</Text>
          </TouchableOpacity>
        )}

        {/* Recent Payments */}
        <View style={styles.paymentsSection}>
          <Text style={styles.sectionTitle}>Payment History</Text>

          {payments.length === 0 ? (
            <View style={styles.emptyPayments}>
              <MaterialIcons name="receipt-long" size={40} color={Colors.light.textMuted} />
              <Text style={styles.emptyText}>No payments yet</Text>
            </View>
          ) : (
            payments.map((payment) => (
              <View key={payment._id} style={[styles.paymentCard, Shadow.sm]}>
                <View style={styles.paymentHeader}>
                  <View style={styles.paymentAmountContainer}>
                    <Text style={styles.paymentAmount}>
                      -${payment.amount.toFixed(2)}
                    </Text>
                    <View style={[styles.paymentTypeBadge, styles.paymentTypeBadgePayment]}>
                      <Text style={styles.paymentTypeText}>
                        {payment.type.charAt(0).toUpperCase() + payment.type.slice(1)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.paymentDate}>
                    {formatDate(payment.recordedAt)}
                  </Text>
                </View>

                <View style={styles.paymentDetails}>
                  <View style={styles.paymentDetailRow}>
                    <MaterialIcons name="account-balance-wallet" size={16} color={Colors.light.textMuted} />
                    <Text style={styles.paymentDetailText}>
                      {payment.method.charAt(0).toUpperCase() + payment.method.slice(1)}
                    </Text>
                  </View>

                  <View style={styles.paymentDetailRow}>
                    <MaterialIcons name="person" size={16} color={Colors.light.textMuted} />
                    <Text style={styles.paymentDetailText}>
                      Recorded by {payment.recordedBy.name}
                    </Text>
                  </View>

                  {payment.note && (
                    <View style={styles.paymentDetailRow}>
                      <MaterialIcons name="notes" size={16} color={Colors.light.textMuted} />
                      <Text style={styles.paymentDetailText}>{payment.note}</Text>
                    </View>
                  )}

                  {payment.receiptUrl && (
                    <View style={styles.receiptSection}>
                      <MaterialIcons name="receipt" size={16} color={Colors.light.accent} />
                      <Text style={styles.receiptText}>Receipt attached</Text>
                    </View>
                  )}
                </View>

                <View style={styles.balanceInfo}>
                  <Text style={styles.balanceInfoText}>
                    Outstanding: ${payment.previousOutstanding.toFixed(2)} → ${payment.newOutstanding.toFixed(2)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    fontSize: FontSize.lg,
    color: Colors.light.error,
    marginBottom: Spacing.md,
  },
  backLink: {
    fontSize: FontSize.md,
    color: Colors.light.primaryMuted,
    textDecorationLine: 'underline',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.light.text,
  },
  summaryCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.primaryMuted + '25',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.light.primaryMuted,
  },
  summaryInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  counterpartyName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.light.text,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  typeBadgeOwes: {
    backgroundColor: Colors.light.accentTeal + '20',
  },
  typeBadgeOwe: {
    backgroundColor: Colors.light.accentOrange + '20',
  },
  typeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  typeTextOwes: {
    color: Colors.light.accentTeal,
  },
  typeTextOwe: {
    color: Colors.light.accentOrange,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  amountItem: {
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: FontSize.sm,
    color: Colors.light.textMuted,
    marginBottom: Spacing.xs,
  },
  amountValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.light.text,
  },
  outstandingAmount: {
    color: Colors.light.accentOrange,
  },
  notesSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  notesLabel: {
    fontSize: FontSize.sm,
    color: Colors.light.textMuted,
    marginBottom: Spacing.xs,
  },
  notesText: {
    fontSize: FontSize.md,
    color: Colors.light.textSecondary,
  },
  recordPaymentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  recordPaymentText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.light.textInverse,
  },
  paymentsSection: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  emptyPayments: {
    alignItems: 'center',
    padding: Spacing.xxxl,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.light.textMuted,
    marginTop: Spacing.md,
  },
  paymentCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  paymentAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  paymentAmount: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.light.text,
  },
  paymentTypeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  paymentTypeBadgePayment: {
    backgroundColor: Colors.light.accent + '20',
  },
  paymentTypeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.light.accent,
  },
  paymentDate: {
    fontSize: FontSize.sm,
    color: Colors.light.textMuted,
  },
  paymentDetails: {
    gap: Spacing.xs,
  },
  paymentDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  paymentDetailText: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
  },
  receiptSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  receiptText: {
    fontSize: FontSize.sm,
    color: Colors.light.accent,
    fontWeight: FontWeight.medium,
  },
  balanceInfo: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  balanceInfoText: {
    fontSize: FontSize.xs,
    color: Colors.light.textMuted,
  },
});

import { BorderRadius, Colors, FontSize, FontWeight, Shadow, Spacing } from '@/constants/theme';
import { createLedger } from '@/services/ledgerService';
import { recordPayment, RecordPaymentData } from '@/services/paymentService';
import { generateIdempotencyKey } from '@/utils/generateIdempotencyKey';
import { usePermissions } from '../src/hooks/usePermissions';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type ModalMode = 'payment' | 'create';

export default function RecordPaymentModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ ledgerId?: string; outstandingBalance?: string }>();
  const { canCreateLedger, canRecordPayment } = usePermissions();
  
  const ledgerId = params.ledgerId;
  const outstandingBalance = ledgerId ? parseFloat(params.outstandingBalance || '0') : 0;
  
  const [mode, setMode] = useState<ModalMode>(() => {
    if (ledgerId) return 'payment';
    return canCreateLedger ? 'create' : 'payment';
  });

  useEffect(() => {
    if (!ledgerId && !canCreateLedger) {
      Alert.alert('Permission Required', 'You do not have permission to create ledgers.');
      router.back();
    }
  }, [canCreateLedger, ledgerId, router]);

  useEffect(() => {
    if (ledgerId && !canRecordPayment) {
      Alert.alert('Permission Required', 'You do not have permission to record payments.');
      router.back();
    }
  }, [canRecordPayment, ledgerId, router]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create ledger state
  const [counterpartyName, setCounterpartyName] = useState('');
  const [initialAmount, setInitialAmount] = useState('');
  const [ledgerType, setLedgerType] = useState<'owes_me' | 'i_owe'>('owes_me');
  const [notes, setNotes] = useState('');

  // Payment state
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'other'>('cash');
  const [note, setNote] = useState('');
  const [receiptAttached, setReceiptAttached] = useState(false);

  const setQuickAmount = (percentage: number) => {
    const value = (outstandingBalance * percentage) / 100;
    setAmount(value.toFixed(2));
  };

  const handleCreateLedger = async () => {
    if (!counterpartyName.trim()) {
      Alert.alert('Error', 'Please enter a counterparty name');
      return;
    }
    if (!initialAmount || parseFloat(initialAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createLedger({
        type: ledgerType,
        counterpartyName: counterpartyName.trim(),
        initialAmount: parseFloat(initialAmount),
        notes: notes.trim() || undefined,
      });
      Alert.alert('Success', 'Ledger created successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create ledger';
      setError(message);
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid payment amount');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (parsedAmount > outstandingBalance) {
      Alert.alert('Error', 'Payment amount cannot exceed outstanding balance');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const idempotencyKey = generateIdempotencyKey();
      const paymentData: RecordPaymentData = {
        amount: parsedAmount,
        method: paymentMethod,
        note: note.trim() || undefined,
        receiptUrl: receiptAttached ? 'uploaded-url' : undefined,
        quick: parsedAmount === outstandingBalance,
      };

      const result = await recordPayment(ledgerId!, paymentData, idempotencyKey);
      
      if (result.idempotent) {
        Alert.alert('Info', 'This payment was already recorded (idempotent response)');
      } else {
        Alert.alert(
          'Success',
          `Payment of $${parsedAmount.toFixed(2)} recorded successfully!\n\nRecorded by: ${result.payment.recordedBy.name}\nNew balance: $${result.payment.newOutstanding.toFixed(2)}`,
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to record payment';
      setError(message);
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (mode === 'create') {
      handleCreateLedger();
    } else {
      handleRecordPayment();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Handle Bar */}
      <View style={styles.handleContainer}>
        <View style={styles.handleBar} />
      </View>

      {/* Mode Toggle (for demo purposes) */}
      {!ledgerId && (
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'create' && styles.modeBtnActive]}
            onPress={() => setMode('create')}
          >
            <Text style={[styles.modeBtnText, mode === 'create' && styles.modeBtnTextActive]}>
              New Ledger
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'payment' && styles.modeBtnActive]}
            onPress={() => setMode('payment')}
          >
            <Text style={[styles.modeBtnText, mode === 'payment' && styles.modeBtnTextActive]}>
              Record Payment
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <Text style={styles.title}>
          {mode === 'create' ? 'Create Ledger' : 'Record Payment'}
        </Text>

        {mode === 'payment' && outstandingBalance > 0 && (
          <>
            <Text style={styles.outstandingLabel}>
              Outstanding Balance:{' '}
              <Text style={styles.outstandingAmount}>${outstandingBalance.toFixed(2)}</Text>
            </Text>
            <Text style={styles.helpText}>
              Record partial payment — outstanding will reduce automatically.
            </Text>
          </>
        )}

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* CREATE LEDGER FORM */}
        {mode === 'create' && (
          <>
            {/* Ledger Type */}
            <View style={styles.section}>
              <Text style={styles.label}>Type</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity
                  style={[
                    styles.typeBtn,
                    ledgerType === 'owes_me' && styles.typeBtnActiveOwes,
                  ]}
                  onPress={() => setLedgerType('owes_me')}
                >
                  <MaterialIcons
                    name="arrow-upward"
                    size={18}
                    color={ledgerType === 'owes_me' ? Colors.light.textInverse : Colors.light.accentTeal}
                  />
                  <Text
                    style={[
                      styles.typeBtnText,
                      ledgerType === 'owes_me' && styles.typeBtnTextActive,
                    ]}
                  >
                    They Owe Me
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeBtn,
                    ledgerType === 'i_owe' && styles.typeBtnActiveOwe,
                  ]}
                  onPress={() => setLedgerType('i_owe')}
                >
                  <MaterialIcons
                    name="arrow-downward"
                    size={18}
                    color={ledgerType === 'i_owe' ? Colors.light.textInverse : Colors.light.accentOrange}
                  />
                  <Text
                    style={[
                      styles.typeBtnText,
                      ledgerType === 'i_owe' && styles.typeBtnTextActive,
                    ]}
                  >
                    I Owe Them
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Counterparty Name */}
            <View style={styles.section}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={[styles.input, Shadow.sm]}
                placeholder="Enter name or company"
                placeholderTextColor={Colors.light.textMuted}
                value={counterpartyName}
                onChangeText={setCounterpartyName}
              />
            </View>

            {/* Initial Amount */}
            <View style={styles.section}>
              <Text style={styles.label}>Initial Amount</Text>
              <View style={[styles.amountInputContainer, Shadow.sm]}>
                <Text style={styles.dollarSign}>$</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  placeholderTextColor={Colors.light.textMuted}
                  keyboardType="numeric"
                  value={initialAmount}
                  onChangeText={setInitialAmount}
                />
              </View>
            </View>

            {/* Notes */}
            <View style={styles.section}>
              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={[styles.noteInput, Shadow.sm]}
                placeholder="Add notes..."
                placeholderTextColor={Colors.light.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </>
        )}

        {/* RECORD PAYMENT FORM */}
        {mode === 'payment' && outstandingBalance > 0 && (
          <>
            {/* Amount Input */}
            <View style={styles.section}>
              <Text style={styles.label}>Payment Amount</Text>
              <View style={[styles.amountInputContainer, Shadow.sm]}>
                <Text style={styles.dollarSign}>$</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  placeholderTextColor={Colors.light.textMuted}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>

              {/* Quick Amount Buttons */}
              <View style={styles.quickAmounts}>
                {[25, 50, 100].map((pct) => (
                  <TouchableOpacity
                    key={pct}
                    style={[
                      styles.quickBtn,
                      amount === ((outstandingBalance * pct) / 100).toFixed(2) &&
                        styles.quickBtnActive,
                    ]}
                    onPress={() => setQuickAmount(pct)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.quickBtnText,
                        amount === ((outstandingBalance * pct) / 100).toFixed(2) &&
                          styles.quickBtnTextActive,
                      ]}
                    >
                      {pct}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Method */}
            <View style={styles.section}>
              <Text style={styles.label}>Method</Text>
              <View style={styles.methodRow}>
                {(['cash', 'bank', 'other'] as const).map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[
                      styles.methodBtn,
                      paymentMethod === method && styles.methodBtnActive,
                    ]}
                    onPress={() => setPaymentMethod(method)}
                  >
                    <MaterialIcons
                      name={
                        method === 'cash'
                          ? 'payments'
                          : method === 'bank'
                          ? 'account-balance'
                          : 'more-horiz'
                      }
                      size={18}
                      color={
                        paymentMethod === method
                          ? Colors.light.textInverse
                          : Colors.light.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.methodBtnText,
                        paymentMethod === method && styles.methodBtnTextActive,
                      ]}
                    >
                      {method.charAt(0).toUpperCase() + method.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Note */}
            <View style={styles.section}>
              <Text style={styles.label}>Note (Optional)</Text>
              <TextInput
                style={[styles.noteInput, Shadow.sm]}
                placeholder="Add a note about this payment..."
                placeholderTextColor={Colors.light.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={note}
                onChangeText={setNote}
              />
            </View>

            {/* Receipt Upload */}
            <View style={styles.section}>
              <Text style={styles.label}>Receipt (Optional)</Text>
              <TouchableOpacity
                style={[styles.receiptBtn, Shadow.sm, receiptAttached && styles.receiptBtnActive]}
                onPress={() => setReceiptAttached(!receiptAttached)}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name={receiptAttached ? 'check-circle' : 'attach-file'}
                  size={20}
                  color={receiptAttached ? Colors.light.accent : Colors.light.textSecondary}
                />
                <Text
                  style={[
                    styles.receiptBtnText,
                    receiptAttached && styles.receiptBtnTextActive,
                  ]}
                >
                  {receiptAttached ? 'Receipt attached' : 'Attach receipt'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {mode === 'payment' && outstandingBalance <= 0 && (
          <View style={styles.settledContainer}>
            <MaterialIcons name="check-circle" size={48} color={Colors.light.accent} />
            <Text style={styles.settledText}>This ledger is fully settled!</Text>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.confirmBtn,
            Shadow.md,
            loading && styles.confirmBtnDisabled,
          ]}
          activeOpacity={0.8}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.light.textInverse} />
          ) : (
            <>
              <MaterialIcons name="check" size={22} color={Colors.light.textInverse} />
              <Text style={styles.confirmBtnText}>
                {mode === 'create' ? 'Create Ledger' : 'Confirm Payment'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Cancel */}
        <TouchableOpacity
          style={styles.cancelBtn}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.textMuted,
  },
  modeToggle: {
    flexDirection: 'row',
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  modeBtnActive: {
    backgroundColor: Colors.light.primary,
  },
  modeBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.light.textSecondary,
  },
  modeBtnTextActive: {
    color: Colors.light.textInverse,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  outstandingLabel: {
    fontSize: FontSize.md,
    color: Colors.light.textSecondary,
  },
  outstandingAmount: {
    fontWeight: FontWeight.bold,
    color: Colors.light.accentOrange,
  },
  helpText: {
    fontSize: FontSize.sm,
    color: Colors.light.textMuted,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  errorContainer: {
    backgroundColor: Colors.light.error + '15',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    color: Colors.light.error,
    fontSize: FontSize.sm,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  typeRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  typeBtnActiveOwes: {
    backgroundColor: Colors.light.accentTeal,
    borderColor: Colors.light.accentTeal,
  },
  typeBtnActiveOwe: {
    backgroundColor: Colors.light.accentOrange,
    borderColor: Colors.light.accentOrange,
  },
  typeBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.light.textSecondary,
  },
  typeBtnTextActive: {
    color: Colors.light.textInverse,
  },
  input: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    fontSize: FontSize.md,
    color: Colors.light.text,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  dollarSign: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.light.textMuted,
    marginRight: Spacing.sm,
  },
  amountInput: {
    flex: 1,
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.light.text,
    paddingVertical: Spacing.sm,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  quickBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
  },
  quickBtnActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  quickBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.light.textSecondary,
  },
  quickBtnTextActive: {
    color: Colors.light.textInverse,
  },
  methodRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  methodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  methodBtnActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  methodBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.light.textSecondary,
  },
  methodBtnTextActive: {
    color: Colors.light.textInverse,
  },
  noteInput: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    fontSize: FontSize.md,
    color: Colors.light.text,
    minHeight: 90,
  },
  receiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  receiptBtnActive: {
    backgroundColor: Colors.light.accent + '15',
    borderColor: Colors.light.accent,
  },
  receiptBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.light.textSecondary,
  },
  receiptBtnTextActive: {
    color: Colors.light.accent,
  },
  settledContainer: {
    alignItems: 'center',
    padding: Spacing.xxxl,
  },
  settledText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.light.accent,
    marginTop: Spacing.md,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmBtnText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.light.textInverse,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  cancelText: {
    fontSize: FontSize.md,
    color: Colors.light.textSecondary,
    fontWeight: FontWeight.medium,
  },
});

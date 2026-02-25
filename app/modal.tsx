import { BorderRadius, Colors, FontSize, FontWeight, Shadow, Spacing } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function RecordPaymentModal() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const outstandingBalance = 450.0;

  const setQuickAmount = (percentage: number) => {
    const value = (outstandingBalance * percentage) / 100;
    setAmount(value.toFixed(2));
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <Text style={styles.title}>Record Payment</Text>
        <Text style={styles.outstandingLabel}>
          Outstanding Balance:{' '}
          <Text style={styles.outstandingAmount}>${outstandingBalance.toFixed(2)}</Text>
        </Text>
        <Text style={styles.helpText}>
          Record partial payment — outstanding will reduce automatically.
        </Text>

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

        {/* Date & Method Row */}
        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity style={[styles.selectBtn, Shadow.sm]} activeOpacity={0.7}>
              <MaterialIcons name="calendar-today" size={18} color={Colors.light.primaryMuted} />
              <Text style={styles.selectBtnText}>Today</Text>
              <MaterialIcons name="expand-more" size={18} color={Colors.light.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Method</Text>
            <TouchableOpacity style={[styles.selectBtn, Shadow.sm]} activeOpacity={0.7}>
              <MaterialIcons name="account-balance-wallet" size={18} color={Colors.light.primaryMuted} />
              <Text style={styles.selectBtnText}>Cash</Text>
              <MaterialIcons name="expand-more" size={18} color={Colors.light.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Processed By */}
        <View style={styles.section}>
          <Text style={styles.label}>Processed by</Text>
          <View style={[styles.processedByCard, Shadow.sm]}>
            <View style={styles.processedByAvatar}>
              <Text style={styles.processedByInitials}>AM</Text>
            </View>
            <View style={styles.processedByInfo}>
              <Text style={styles.processedByName}>Alex Morgan</Text>
              <Text style={styles.processedByRole}>Owner</Text>
            </View>
            <MaterialIcons name="check-circle" size={20} color={Colors.light.accent} />
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

        {/* Confirm Button */}
        <TouchableOpacity
          style={[styles.confirmBtn, Shadow.md]}
          activeOpacity={0.8}
          onPress={() => router.back()}
        >
          <MaterialIcons name="check" size={22} color={Colors.light.textInverse} />
          <Text style={styles.confirmBtnText}>Confirm Payment</Text>
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
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  halfField: {
    flex: 1,
  },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: Spacing.sm,
  },
  selectBtnText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.light.text,
  },
  processedByCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: Spacing.md,
  },
  processedByAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primaryMuted + '25',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processedByInitials: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.light.primaryMuted,
  },
  processedByInfo: {
    flex: 1,
  },
  processedByName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.light.text,
  },
  processedByRole: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
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

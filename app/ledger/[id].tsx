import { BorderRadius, Colors, FontSize, FontWeight, Shadow, Spacing } from '@/constants/theme';
import { deleteLedger, getLedgerById, Ledger, updateLedger, UpdateLedgerData } from '@/services/ledgerService';
import { getPayments, Payment } from '@/services/paymentService';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePermissions } from '@/src/hooks/usePermissions';

export default function LedgerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { canEditLedger, canDeleteLedger } = usePermissions();
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editData, setEditData] = useState<UpdateLedgerData>({});
  const [newTag, setNewTag] = useState('');

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
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleEdit = async () => {
    if (!editData || Object.keys(editData).length === 0) {
      setShowEditModal(false);
      return;
    }

    setEditLoading(true);
    try {
      const updated = await updateLedger(id!, editData);
      setLedger(updated);
      setShowEditModal(false);
      setEditData({});
      Alert.alert('Success', 'Ledger updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update ledger');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Ledger',
      'Are you sure you want to delete this ledger? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLedger(id!);
              Alert.alert('Success', 'Ledger deleted', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete ledger');
            }
          },
        },
      ]
    );
  };

  const openEditModal = () => {
    setEditData({
      counterpartyName: ledger?.counterpartyName,
      notes: ledger?.notes,
      priority: ledger?.priority,
      tags: ledger?.tags ? [...ledger.tags] : [],
    });
    setNewTag('');
    setShowEditModal(true);
    setShowMenu(false);
  };

  const addTag = () => {
    if (newTag.trim()) {
      const currentTags = editData.tags || [];
      setEditData({ ...editData, tags: [...currentTags, newTag.trim()] });
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    const currentTags = editData.tags || [];
    setEditData({ ...editData, tags: currentTags.filter((_, i) => i !== index) });
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
          <TouchableOpacity activeOpacity={0.7} onPress={() => setShowMenu(true)}>
            <MaterialIcons name="more-vert" size={24} color={Colors.light.text} />
          </TouchableOpacity>
        </View>

        {/* Dropdown Menu */}
        <Modal
          visible={showMenu}
          transparent
          animationType="fade"
          onRequestClose={() => setShowMenu(false)}
        >
          <Pressable style={styles.menuOverlay} onPress={() => setShowMenu(false)}>
            <View style={styles.menuContainer}>
              {canEditLedger && (
                <TouchableOpacity style={styles.menuItem} onPress={openEditModal}>
                  <MaterialIcons name="edit" size={20} color={Colors.light.text} />
                  <Text style={styles.menuText}>Edit</Text>
                </TouchableOpacity>
              )}
              {canDeleteLedger && (
                <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
                  <MaterialIcons name="delete" size={20} color={Colors.light.error} />
                  <Text style={[styles.menuText, styles.menuTextDelete]}>Delete</Text>
                </TouchableOpacity>
              )}
              {!canEditLedger && !canDeleteLedger && (
                <Text style={styles.noPermissionsText}>No actions available</Text>
              )}
            </View>
          </Pressable>
        </Modal>

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

          {/* Tags */}
          {ledger.tags && ledger.tags.length > 0 && (
            <View style={styles.tagsSection}>
              <Text style={styles.notesLabel}>Tags</Text>
              <View style={styles.tagsRow}>
                {ledger.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Attachments */}
          {ledger.attachments && ledger.attachments.length > 0 && (
            <View style={styles.attachmentsSection}>
              <Text style={styles.notesLabel}>Attachments</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.attachmentsScroll}>
                <View style={styles.attachmentsRow}>
                  {ledger.attachments.map((attachment, index) => (
                    <TouchableOpacity key={index} style={styles.attachmentItem} activeOpacity={0.7}>
                      <MaterialIcons name="image" size={32} color={Colors.light.primaryMuted} />
                      <Text style={styles.attachmentText}>Receipt {index + 1}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
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

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.editModalOverlay}>
          <View style={[styles.editModalContainer, Shadow.lg]}>
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>Edit Ledger</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <MaterialIcons name="close" size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.editModalContent}>
                <View style={styles.editInputGroup}>
                  <Text style={styles.editLabel}>Name</Text>
                  <TextInput
                    style={[styles.editInput, Shadow.sm]}
                    value={editData.counterpartyName || ''}
                    onChangeText={(text) => setEditData({ ...editData, counterpartyName: text })}
                    placeholder="Enter name"
                    placeholderTextColor={Colors.light.textMuted}
                  />
                </View>

                <View style={styles.editInputGroup}>
                  <Text style={styles.editLabel}>Priority</Text>
                  <View style={styles.priorityRow}>
                    {(['low', 'medium', 'high'] as const).map((p) => (
                      <TouchableOpacity
                        key={p}
                        style={[
                          styles.priorityBtn,
                          editData.priority === p && styles.priorityBtnActive,
                          editData.priority === p && p === 'high' && styles.priorityBtnHigh,
                          editData.priority === p && p === 'medium' && styles.priorityBtnMedium,
                          editData.priority === p && p === 'low' && styles.priorityBtnLow,
                        ]}
                        onPress={() => setEditData({ ...editData, priority: p })}
                      >
                        <Text
                          style={[
                            styles.priorityBtnText,
                            editData.priority === p && styles.priorityBtnTextActive,
                          ]}
                        >
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.editInputGroup}>
                  <Text style={styles.editLabel}>Notes</Text>
                  <TextInput
                    style={[styles.editTextArea, Shadow.sm]}
                    value={editData.notes || ''}
                    onChangeText={(text) => setEditData({ ...editData, notes: text })}
                    placeholder="Add notes..."
                    placeholderTextColor={Colors.light.textMuted}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                {/* Tags */}
                <View style={styles.editInputGroup}>
                  <Text style={styles.editLabel}>Tags</Text>
                  <View style={styles.editTagsRow}>
                    {(editData.tags || []).map((tag, index) => (
                      <View key={index} style={styles.editTag}>
                        <Text style={styles.editTagText}>{tag}</Text>
                        <TouchableOpacity onPress={() => removeTag(index)}>
                          <MaterialIcons name="close" size={16} color={Colors.light.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                  <View style={styles.addTagRow}>
                    <TextInput
                      style={[styles.tagInput, Shadow.sm]}
                      value={newTag}
                      onChangeText={setNewTag}
                      placeholder="Add tag..."
                      placeholderTextColor={Colors.light.textMuted}
                      onSubmitEditing={addTag}
                    />
                    <TouchableOpacity style={styles.addTagBtn} onPress={addTag}>
                      <MaterialIcons name="add" size={20} color={Colors.light.textInverse} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.editModalActions}>
              <TouchableOpacity
                style={styles.editCancelBtn}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.editCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editSaveBtn, Shadow.sm, editLoading && styles.editSaveBtnDisabled]}
                onPress={handleEdit}
                disabled={editLoading}
              >
                {editLoading ? (
                  <ActivityIndicator size="small" color={Colors.light.textInverse} />
                ) : (
                  <Text style={styles.editSaveText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: 20,
  },
  menuContainer: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    minWidth: 150,
    ...Shadow.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  menuText: {
    fontSize: FontSize.md,
    color: Colors.light.text,
  },
  menuTextDelete: {
    color: Colors.light.error,
  },
  noPermissionsText: {
    fontSize: FontSize.sm,
    color: Colors.light.textMuted,
    padding: Spacing.md,
    textAlign: 'center',
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
  tagsSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tag: {
    backgroundColor: Colors.light.primary + '15',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  tagText: {
    fontSize: FontSize.sm,
    color: Colors.light.primary,
    fontWeight: FontWeight.medium,
  },
  attachmentsSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  attachmentsScroll: {
    marginTop: Spacing.sm,
  },
  attachmentsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  attachmentItem: {
    width: 100,
    height: 100,
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  attachmentText: {
    fontSize: FontSize.xs,
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
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  editModalContainer: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    maxHeight: '80%',
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  editModalTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.light.text,
  },
  editModalContent: {
    padding: Spacing.xl,
  },
  editInputGroup: {
    marginBottom: Spacing.lg,
  },
  editLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.sm,
  },
  editInput: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    fontSize: FontSize.md,
    color: Colors.light.text,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  priorityBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
  },
  priorityBtnActive: {
    borderColor: Colors.light.primary,
  },
  priorityBtnHigh: {
    backgroundColor: Colors.light.error + '20',
    borderColor: Colors.light.error,
  },
  priorityBtnMedium: {
    backgroundColor: Colors.light.warning + '20',
    borderColor: Colors.light.warning,
  },
  priorityBtnLow: {
    backgroundColor: Colors.light.accent + '20',
    borderColor: Colors.light.accent,
  },
  priorityBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.light.textSecondary,
  },
  priorityBtnTextActive: {
    color: Colors.light.text,
  },
  editTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  editTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.light.primary + '20',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  editTagText: {
    fontSize: FontSize.sm,
    color: Colors.light.primary,
    fontWeight: FontWeight.medium,
  },
  addTagRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  tagInput: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    fontSize: FontSize.md,
    color: Colors.light.text,
  },
  addTagBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editTextArea: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    fontSize: FontSize.md,
    color: Colors.light.text,
    minHeight: 100,
  },
  editModalActions: {
    flexDirection: 'row',
    padding: Spacing.xl,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  editCancelBtn: {
    flex: 1,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
  },
  editCancelText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.light.textSecondary,
  },
  editSaveBtn: {
    flex: 2,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
  },
  editSaveBtnDisabled: {
    opacity: 0.6,
  },
  editSaveText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.light.textInverse,
  },
});

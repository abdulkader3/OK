import { BorderRadius, Colors, FontSize, FontWeight, Shadow, Spacing } from '@/constants/theme';
import { getAllBills, BillListItem, BillsResponse, deleteBill, updateBill } from '@/src/services/bigBossService';
import { payBill, unpayBill } from '@/src/services/monthlyBalanceService';
import { useLanguage } from '@/src/contexts/LanguageContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View, Alert, Modal, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AllBillsScreen() {
    const router = useRouter();
    const { t } = useLanguage();
    
    const [billsResponse, setBillsResponse] = useState<BillsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Edit Bill state
    const [showEditBillModal, setShowEditBillModal] = useState(false);
    const [editingBill, setEditingBill] = useState<BillListItem | null>(null);
    const [editBillMonth, setEditBillMonth] = useState('');
    const [editBillYear, setEditBillYear] = useState('');
    const [editBillAmount, setEditBillAmount] = useState('');
    const [editBillDescription, setEditBillDescription] = useState('');
    const [updatingBill, setUpdatingBill] = useState(false);
    const [payingBillId, setPayingBillId] = useState<string | null>(null);

    const handlePayBill = async (billId: string, isPaid: boolean) => {
        const action = isPaid ? 'unpay' : 'pay';
        const confirmMessage = isPaid 
            ? 'Do you want to mark this bill as unpaid? This will add the amount back to your monthly balance.'
            : 'Do you want to mark this bill as paid? This will deduct the amount from your monthly balance.';
        
        Alert.alert(
            isPaid ? 'Unpay Bill' : 'Pay Bill',
            confirmMessage,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: isPaid ? 'Unpay' : 'Pay',
                    onPress: async () => {
                        setPayingBillId(billId);
                        try {
                            const result = isPaid 
                                ? await unpayBill(billId)
                                : await payBill(billId);
                            
                            // Check exact backend response
                            if (result?.success === true && result?.data?.bill?.isPaid === true) {
                                fetchBills();
                                Alert.alert('Success', result?.message || `Bill ${action}d successfully`);
                            } else {
                                Alert.alert('Error', result?.message || `Failed to ${action} bill`);
                            }
                        } catch (err) {
                            Alert.alert('Error', `Failed to ${action} bill`);
                        } finally {
                            setPayingBillId(null);
                        }
                    },
                },
            ]
        );
    };

    const fetchBills = useCallback(async () => {
        try {
            setError(null);
            const data = await getAllBills();
            setBillsResponse(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load bills');
            console.error('Error fetching bills:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchBills();
    }, [fetchBills]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchBills();
    }, [fetchBills]);

    const formatCurrency = (amount: number) => {
        return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const getMonthName = (month: number) => {
        const months = [
            t('bigboss.january'), t('bigboss.february'), t('bigboss.march'),
            t('bigboss.april'), t('bigboss.may'), t('bigboss.june'),
            t('bigboss.july'), t('bigboss.august'), t('bigboss.september'),
            t('bigboss.october'), t('bigboss.november'), t('bigboss.december'),
        ];
        return months[month - 1] || '';
    };

    const handleDeleteBill = async (billId: string) => {
        Alert.alert(
            'Delete Bill',
            'Are you sure you want to delete this bill?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const success = await deleteBill(billId);
                            if (success) {
                                fetchBills();
                                Alert.alert('Success', 'Bill deleted successfully');
                            } else {
                                Alert.alert('Error', 'Failed to delete bill');
                            }
                        } catch (err) {
                            Alert.alert('Error', 'Failed to delete bill');
                            console.error('Error deleting bill:', err);
                        }
                    },
                },
            ]
        );
    };

    const handleEditBill = (bill: BillListItem) => {
        setEditingBill(bill);
        setEditBillMonth(String(bill.month));
        setEditBillYear(String(bill.year));
        setEditBillAmount(String(bill.amount));
        setEditBillDescription(bill.description || '');
        setShowEditBillModal(true);
    };

    const handleUpdateBill = async () => {
        if (!editingBill) return;

        const month = parseInt(editBillMonth, 10);
        const year = parseInt(editBillYear, 10);
        const amount = parseFloat(editBillAmount);

        if (!editBillMonth || !editBillYear || !editBillAmount || isNaN(month) || isNaN(year) || isNaN(amount)) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        if (month < 1 || month > 12) {
            Alert.alert('Error', 'Month must be between 1 and 12');
            return;
        }

        if (amount <= 0) {
            Alert.alert('Error', 'Amount must be greater than 0');
            return;
        }

        setUpdatingBill(true);
        try {
            const result = await updateBill(editingBill._id, {
                month,
                year,
                amount,
                description: editBillDescription.trim() || undefined,
            });

            if (result) {
                setShowEditBillModal(false);
                setEditingBill(null);
                fetchBills();
                Alert.alert('Success', 'Bill updated successfully');
            } else {
                Alert.alert('Error', 'Failed to update bill');
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to update bill');
            console.error('Error updating bill:', err);
        } finally {
            setUpdatingBill(false);
        }
    };

    const renderBillItem = ({ item }: { item: BillListItem }) => (
        <View style={styles.billCard}>
            <TouchableOpacity 
                style={styles.billCardContent}
                onPress={() => router.push({ pathname: '/bigboss/[id]', params: { id: item.bigBossId._id } })}
                activeOpacity={0.7}
            >
                <View style={styles.billHeader}>
                    <View style={styles.bigBossInfo}>
                        <MaterialIcons name="business" size={20} color={Colors.light.primary} />
                        <Text style={styles.bigBossName}>{item.bigBossId.name}</Text>
                    </View>
                    <Text style={styles.billAmount}>{formatCurrency(item.amount)}</Text>
                </View>
                <View style={styles.billDetails}>
                    <Text style={styles.billDate}>
                        {getMonthName(item.month)} {item.year}
                    </Text>
                    {item.description && (
                        <Text style={styles.billDescription} numberOfLines={1}>
                            {item.description}
                        </Text>
                    )}
                </View>
                {item.attachment && (
                    <View style={styles.attachmentIndicator}>
                        <MaterialIcons name="attach-file" size={14} color={Colors.light.textMuted} />
                        <Text style={styles.attachmentText}>Attachment</Text>
                    </View>
                )}
            </TouchableOpacity>
            
            <View style={styles.billActionsRow}>
                <TouchableOpacity 
                    onPress={() => handlePayBill(item._id, !!item.isPaid)}
                    style={[
                        styles.payButton, 
                        item.isPaid ? styles.paidButton : styles.unpaidButton
                    ]}
                    disabled={payingBillId === item._id}
                >
                    {payingBillId === item._id ? (
                        <ActivityIndicator size="small" color={Colors.light.white} />
                    ) : (
                        <>
                            <MaterialIcons 
                                name={item.isPaid ? "check-circle" : "payments"} 
                                size={18} 
                                color={Colors.light.white} 
                            />
                            <Text style={styles.payButtonText}>
                                {item.isPaid ? 'Paid' : 'Pay'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
                
                <View style={styles.cardActions}>
                    <TouchableOpacity 
                        onPress={() => handleEditBill(item)}
                        style={styles.editButton}
                    >
                        <MaterialIcons name="edit" size={20} color={Colors.light.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => handleDeleteBill(item._id)}
                        style={styles.deleteButton}
                    >
                        <MaterialIcons name="delete" size={20} color={Colors.light.error} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <MaterialIcons name="receipt-long" size={64} color={Colors.light.textMuted} />
            <Text style={styles.emptyTitle}>{t('bigboss.noBills')}</Text>
        </View>
    );

    const renderHeader = () => {
        if (!billsResponse) return null;
        return (
            <View style={styles.summaryContainer}>
                <Text style={styles.summaryLabel}>Total Amount</Text>
                <Text style={styles.summaryValue}>{formatCurrency(billsResponse.totalAmount)}</Text>
                <Text style={styles.billsCount}>
                    {billsResponse.pagination.total} {billsResponse.pagination.total === 1 ? 'bill' : 'bills'}
                </Text>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.light.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.container}>
                <FlatList
                    data={billsResponse?.bills || []}
                    renderItem={renderBillItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={Colors.light.primary}
                        />
                    }
                    ListHeaderComponent={renderHeader}
                    ListEmptyComponent={renderEmpty}
                />
            </View>

            {/* Edit Bill Modal */}
            <Modal
                visible={showEditBillModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => {
                    setShowEditBillModal(false);
                    setEditingBill(null);
                }}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => {
                            setShowEditBillModal(false);
                            setEditingBill(null);
                        }}>
                            <MaterialIcons name="close" size={24} color={Colors.light.text} />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>{t('bigboss.createBill')}</Text>
                        <TouchableOpacity 
                            onPress={handleUpdateBill}
                            disabled={updatingBill}
                        >
                            {updatingBill ? (
                                <ActivityIndicator size="small" color={Colors.light.primary} />
                            ) : (
                                <Text style={styles.saveButton}>Save</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent}>
                        <View style={styles.inputRow}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: Spacing.sm }]}>
                                <Text style={styles.inputLabel}>{t('bigboss.month')} (1-12) *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editBillMonth}
                                    onChangeText={setEditBillMonth}
                                    placeholder="1"
                                    placeholderTextColor={Colors.light.textMuted}
                                    keyboardType="number-pad"
                                    maxLength={2}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.inputLabel}>{t('bigboss.year')} *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editBillYear}
                                    onChangeText={setEditBillYear}
                                    placeholder="2026"
                                    placeholderTextColor={Colors.light.textMuted}
                                    keyboardType="number-pad"
                                    maxLength={4}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>{t('bigboss.amount')} *</Text>
                            <TextInput
                                style={styles.input}
                                value={editBillAmount}
                                onChangeText={setEditBillAmount}
                                placeholder="0.00"
                                placeholderTextColor={Colors.light.textMuted}
                                keyboardType="decimal-pad"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>
                                {t('bigboss.description')} {t('bigboss.optional')}
                            </Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={editBillDescription}
                                onChangeText={setEditBillDescription}
                                placeholder={t('bigboss.description')}
                                placeholderTextColor={Colors.light.textMuted}
                                multiline
                                numberOfLines={3}
                            />
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: Spacing.md,
        flexGrow: 1,
    },
    summaryContainer: {
        backgroundColor: Colors.light.primary,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    summaryLabel: {
        fontSize: FontSize.sm,
        color: Colors.light.textMuted,
        textTransform: 'uppercase',
    },
    summaryValue: {
        fontSize: FontSize.hero,
        fontWeight: FontWeight.bold,
        color: Colors.light.textInverse,
        marginVertical: Spacing.xs,
    },
    billsCount: {
        fontSize: FontSize.sm,
        color: Colors.light.textMuted,
    },
    billCard: {
        backgroundColor: Colors.light.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        ...Shadow.sm,
    },
    billCardContent: {
        flex: 1,
    },
    cardActions: {
        flexDirection: 'row',
    },
    billActionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: Colors.light.border,
        marginTop: Spacing.sm,
    },
    editButton: {
        padding: Spacing.xs,
    },
    deleteButton: {
        padding: Spacing.xs,
    },
    payButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.md,
        gap: Spacing.xs,
    },
    paidButton: {
        backgroundColor: Colors.light.success,
    },
    unpaidButton: {
        backgroundColor: Colors.light.primary,
    },
    payButtonText: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
        color: Colors.light.white,
    },
    billHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bigBossInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    bigBossName: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
        color: Colors.light.text,
        marginLeft: Spacing.sm,
    },
    billAmount: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: Colors.light.accent,
    },
    billDetails: {
        marginTop: Spacing.sm,
    },
    billDate: {
        fontSize: FontSize.sm,
        color: Colors.light.textSecondary,
    },
    billDescription: {
        fontSize: FontSize.sm,
        color: Colors.light.textMuted,
        marginTop: Spacing.xs,
    },
    attachmentIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.sm,
    },
    attachmentText: {
        fontSize: FontSize.xs,
        color: Colors.light.textMuted,
        marginLeft: Spacing.xs,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 80,
    },
    emptyTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
        color: Colors.light.text,
        marginTop: Spacing.md,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
    },
    modalTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
        color: Colors.light.text,
    },
    saveButton: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
        color: Colors.light.primary,
    },
    modalContent: {
        flex: 1,
        padding: Spacing.md,
    },
    inputRow: {
        flexDirection: 'row',
    },
    inputGroup: {
        marginBottom: Spacing.lg,
    },
    inputLabel: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
        color: Colors.light.textSecondary,
        marginBottom: Spacing.xs,
    },
    input: {
        backgroundColor: Colors.light.surface,
        borderRadius: BorderRadius.sm,
        borderWidth: 1,
        borderColor: Colors.light.border,
        padding: Spacing.md,
        fontSize: FontSize.md,
        color: Colors.light.text,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
});

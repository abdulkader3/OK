import { DebtEntryCard } from '@/components/debt-entry-card';
import { FABButton } from '@/components/fab-button';
import { FilterPills } from '@/components/filter-pills';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { getLedgers, Ledger } from '@/services/ledgerService';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type FilterType = 'All' | 'Lent' | 'Borrowed' | 'Overdue' | 'Settled';

export default function LedgerScreen() {
    const router = useRouter();
    const [searchText, setSearchText] = useState('');
    const [ledgers, setLedgers] = useState<Ledger[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<FilterType>('All');

    const fetchLedgers = useCallback(async () => {
        try {
            setError(null);
            const filters: Record<string, string> = {};
            
            if (activeFilter === 'Lent') filters.type = 'owes_me';
            if (activeFilter === 'Borrowed') filters.type = 'i_owe';
            if (searchText) filters.search = searchText;
            
            const response = await getLedgers(filters as any);
            setLedgers(response.ledgers || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load ledgers');
            console.error('Error fetching ledgers:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeFilter, searchText]);

    useEffect(() => {
        fetchLedgers();
    }, [fetchLedgers]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchLedgers();
    }, [fetchLedgers]);

    const getStatusInfo = (ledger: Ledger) => {
        const now = new Date();
        const dueDate = ledger.dueDate ? new Date(ledger.dueDate) : null;
        const isOverdue = dueDate && dueDate < now && ledger.outstandingBalance > 0;
        const isPaid = ledger.outstandingBalance <= 0;

        if (isPaid) return { label: 'Settled', type: 'paid' as const };
        if (isOverdue) {
            const daysOverdue = Math.floor((now.getTime() - dueDate!.getTime()) / (1000 * 60 * 60 * 24));
            return { label: `Overdue by ${daysOverdue} days`, type: 'overdue' as const };
        }
        return { label: 'Active', type: 'active' as const };
    };

    const formatAmount = (amount: number, type: 'owes_me' | 'i_owe') => {
        const prefix = type === 'owes_me' ? '+' : '-';
        return `${prefix}$${Math.abs(amount).toFixed(2)}`;
    };

    const getLedgerType = (type: 'owes_me' | 'i_owe'): 'lent' | 'borrowed' => {
        return type === 'owes_me' ? 'lent' : 'borrowed';
    };

    const renderLedger = (ledger: Ledger) => {
        const status = getStatusInfo(ledger);
        return (
            <TouchableOpacity 
                key={ledger._id} 
                activeOpacity={0.9}
                onPress={() => router.push({ pathname: '/ledger/[id]', params: { id: ledger._id } })}
            >
                <DebtEntryCard
                    name={ledger.counterpartyName}
                    statusLabel={status.label}
                    statusType={status.type}
                    type={getLedgerType(ledger.type)}
                    description={ledger.notes}
                    amount={formatAmount(ledger.outstandingBalance, ledger.type)}
                    onRecordPayment={() => router.push({ pathname: '/modal', params: { ledgerId: ledger._id, outstandingBalance: ledger.outstandingBalance } })}
                    onSettleUp={() => router.push({ pathname: '/modal', params: { ledgerId: ledger._id, outstandingBalance: ledger.outstandingBalance } })}
                />
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity activeOpacity={0.7}>
                        <MaterialIcons name="menu" size={24} color={Colors.light.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Debt Ledger</Text>
                    <TouchableOpacity style={styles.exportBtn} activeOpacity={0.7}>
                        <MaterialIcons name="file-download" size={18} color={Colors.light.primaryMuted} />
                        <Text style={styles.exportText}>Export</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    {/* Search Bar */}
                    <View style={styles.searchContainer}>
                        <MaterialIcons name="search" size={20} color={Colors.light.textMuted} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search debts..."
                            placeholderTextColor={Colors.light.textMuted}
                            value={searchText}
                            onChangeText={setSearchText}
                        />
                        {searchText.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchText('')} activeOpacity={0.7}>
                                <MaterialIcons name="close" size={18} color={Colors.light.textMuted} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Filter Pills */}
                    <FilterPills 
                        filters={['All', 'Lent', 'Borrowed', 'Overdue', 'Settled']}
                        onFilterChange={(filter) => setActiveFilter(filter as FilterType)}
                        activeFilter={activeFilter}
                    />

                    {/* Error Message */}
                    {error && (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{error}</Text>
                            <TouchableOpacity onPress={fetchLedgers}>
                                <Text style={styles.retryText}>Tap to retry</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Loading State */}
                    {loading && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={Colors.light.primaryMuted} />
                        </View>
                    )}

                    {/* Section Title */}
                    {!loading && !error && (
                        <Text style={styles.sectionTitle}>Recent Entries</Text>
                    )}

                    {/* Debt Entries */}
                    {!loading && !error && ledgers.map(renderLedger)}

                    {/* Empty State */}
                    {!loading && !error && ledgers.length === 0 && (
                        <View style={styles.emptyContainer}>
                            <MaterialIcons name="inbox" size={48} color={Colors.light.textMuted} />
                            <Text style={styles.emptyText}>No ledgers found</Text>
                            <Text style={styles.emptySubtext}>Create your first ledger to get started</Text>
                        </View>
                    )}
                </ScrollView>

                {/* FAB */}
                <FABButton
                    onPress={() => router.push('/modal')}
                    backgroundColor={Colors.light.primaryMuted}
                />
            </View>
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
    exportBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        backgroundColor: Colors.light.surface,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    exportText: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
        color: Colors.light.primaryMuted,
    },
    scrollContent: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: 120,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.light.surface,
        borderRadius: BorderRadius.xl,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        gap: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    searchInput: {
        flex: 1,
        fontSize: FontSize.md,
        color: Colors.light.text,
        paddingVertical: 0,
    },
    sectionTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: Colors.light.text,
        marginTop: Spacing.lg,
        marginBottom: Spacing.md,
    },
    errorContainer: {
        backgroundColor: Colors.light.error + '15',
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        marginTop: Spacing.md,
        alignItems: 'center',
    },
    errorText: {
        color: Colors.light.error,
        fontSize: FontSize.md,
    },
    retryText: {
        color: Colors.light.error,
        fontSize: FontSize.sm,
        marginTop: Spacing.xs,
        textDecorationLine: 'underline',
    },
    loadingContainer: {
        padding: Spacing.xxxl,
        alignItems: 'center',
    },
    emptyContainer: {
        padding: Spacing.xxxl,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
        color: Colors.light.text,
        marginTop: Spacing.md,
    },
    emptySubtext: {
        fontSize: FontSize.md,
        color: Colors.light.textMuted,
        marginTop: Spacing.xs,
    },
});

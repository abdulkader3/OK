import { DebtEntryCard } from '@/components/debt-entry-card';
import { FABButton } from '@/components/fab-button';
import { FilterPills } from '@/components/filter-pills';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LedgerScreen() {
    const router = useRouter();
    const [searchText, setSearchText] = useState('');

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
                    <FilterPills filters={['All', 'Lent', 'Borrowed', 'Overdue', 'Settled']} />

                    {/* Section Title */}
                    <Text style={styles.sectionTitle}>Recent Entries</Text>

                    {/* Debt Entries */}
                    <DebtEntryCard
                        name="Sarah Jenkins"
                        statusLabel="Active"
                        statusType="active"
                        type="lent"
                        amount="$450.00"
                        onRecordPayment={() => router.push('/modal')}
                    />

                    <DebtEntryCard
                        name="Mike Ross"
                        statusLabel="Overdue by 5 days"
                        statusType="overdue"
                        type="borrowed"
                        amount="$1,200.00"
                        onSettleUp={() => router.push('/modal')}
                    />

                    <DebtEntryCard
                        name="John Doe"
                        statusLabel="Active"
                        statusType="active"
                        type="lent"
                        description="Dinner Split"
                        amount="$42.50"
                        onRecordPayment={() => router.push('/modal')}
                    />

                    <DebtEntryCard
                        name="Emily Chen"
                        statusLabel="Active"
                        statusType="active"
                        type="borrowed"
                        description="Project Freelance"
                        amount="$2,500.00"
                        onSettleUp={() => router.push('/modal')}
                    />
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
});

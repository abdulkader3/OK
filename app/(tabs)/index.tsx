import { FABButton } from '@/components/fab-button';
import { FilterPills } from '@/components/filter-pills';
import { SummaryCard } from '@/components/summary-card';
import { TransactionItem } from '@/components/transaction-item';
import { BorderRadius, Colors, FontSize, FontWeight, Shadow, Spacing } from '@/constants/theme';
import { getDashboardSummary, DashboardLedger } from '@/services/dashboardService';
import { useAuth } from '@/contexts/AuthContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [summary, setSummary] = useState<{
    totalOwedToMe: number;
    totalIOwe: number;
    overdueCount: number;
    highPriorityCount: number;
    recentLedgers: DashboardLedger[];
    dueLedgers: DashboardLedger[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSummary = useCallback(async () => {
    try {
      const data = await getDashboardSummary();
      setSummary(data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSummary();
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const renderLedgerItem = (ledger: DashboardLedger, index: number) => {
    const isPositive = ledger.type === 'owes_me';
    return (
      <TransactionItem
        key={ledger._id}
        name={ledger.counterpartyName}
        description={ledger.priority.charAt(0).toUpperCase() + ledger.priority.slice(1) + ' Priority'}
        time={new Date(ledger.createdAt).toLocaleDateString()}
        amount={formatCurrency(ledger.outstandingBalance)}
        isPositive={isPositive}
        avatarColor={isPositive ? Colors.light.accentTeal : Colors.light.accentOrange}
      />
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primaryMuted} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>
                {user?.name?.charAt(0)?.toUpperCase() || 'O'}
              </Text>
            </View>
            <View>
              <Text style={styles.welcomeLabel}>WELCOME BACK</Text>
              <Text style={styles.ownerName}>{user?.name || 'Owner'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notifBtn} activeOpacity={0.7}>
            <MaterialIcons name="notifications-none" size={24} color={Colors.light.text} />
            {summary && summary.overdueCount > 0 && <View style={styles.notifDot} />}
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Summary Cards */}
          <View style={styles.cardsGrid}>
            <View style={styles.cardRow}>
              <SummaryCard
                icon="arrow-downward"
                label="Owed to Me"
                amount={formatCurrency(summary?.totalOwedToMe || 0)}
                backgroundColor={Colors.light.cardOwed}
                iconColor={Colors.light.primaryMuted}
                amountColor={Colors.light.primary}
              />
              <SummaryCard
                icon="arrow-upward"
                label="I Owe"
                amount={formatCurrency(summary?.totalIOwe || 0)}
                backgroundColor={Colors.light.cardIOwe}
                iconColor={Colors.light.accentOrange}
                amountColor={Colors.light.primary}
              />
            </View>
            <View style={styles.cardRow}>
              <SummaryCard
                icon="warning"
                label="Overdue"
                amount={String(summary?.overdueCount || 0)}
                backgroundColor={Colors.light.cardOverdue}
                iconColor={Colors.light.error}
                amountColor={Colors.light.error}
              />
              <SummaryCard
                icon="schedule"
                label="High Priority"
                amount={String(summary?.highPriorityCount || 0)}
                backgroundColor={Colors.light.cardPending}
                iconColor={Colors.light.accent}
                amountColor={Colors.light.accent}
              />
            </View>
          </View>

          {/* Filter Pills */}
          <FilterPills filters={['All Activity', 'Due Soon', 'High Amount']} />

          {/* Recent Activity */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => router.push('/(tabs)/ledger')}
            >
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          {summary?.recentLedgers && summary.recentLedgers.length > 0 ? (
            summary.recentLedgers.slice(0, 4).map((ledger, index) => renderLedgerItem(ledger, index))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No recent activity</Text>
            </View>
          )}
        </ScrollView>

        {/* FAB */}
        <FABButton onPress={() => router.push('/modal')} />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.light.textInverse,
  },
  welcomeLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.light.textSecondary,
    letterSpacing: 1,
  },
  ownerName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.light.text,
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.sm,
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.error,
    borderWidth: 1.5,
    borderColor: Colors.light.surface,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 120,
  },
  cardsGrid: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.light.text,
  },
  viewAll: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.light.primaryMuted,
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.light.textMuted,
  },
});

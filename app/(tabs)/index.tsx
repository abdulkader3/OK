import { FABButton } from '@/components/fab-button';
import { FilterPills } from '@/components/filter-pills';
import { SummaryCard } from '@/components/summary-card';
import { TransactionItem } from '@/components/transaction-item';
import { BorderRadius, Colors, FontSize, FontWeight, Shadow, Spacing } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>O</Text>
            </View>
            <View>
              <Text style={styles.welcomeLabel}>WELCOME BACK</Text>
              <Text style={styles.ownerName}>Owner</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notifBtn} activeOpacity={0.7}>
            <MaterialIcons name="notifications-none" size={24} color={Colors.light.text} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Summary Cards */}
          <View style={styles.cardsGrid}>
            <View style={styles.cardRow}>
              <SummaryCard
                icon="arrow-downward"
                label="Owed to Me"
                amount="$12,450"
                backgroundColor={Colors.light.cardOwed}
                iconColor={Colors.light.primaryMuted}
                amountColor={Colors.light.primary}
              />
              <SummaryCard
                icon="arrow-upward"
                label="I Owe"
                amount="$850"
                backgroundColor={Colors.light.cardIOwe}
                iconColor={Colors.light.accentOrange}
                amountColor={Colors.light.primary}
              />
            </View>
            <View style={styles.cardRow}>
              <SummaryCard
                icon="warning"
                label="Overdue"
                amount="$320"
                backgroundColor={Colors.light.cardOverdue}
                iconColor={Colors.light.error}
                amountColor={Colors.light.error}
              />
              <SummaryCard
                icon="schedule"
                label="Pending"
                amount="$150"
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
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          <TransactionItem
            name="John Doe"
            description="Grocery Split"
            time="Today, 10:23 AM"
            amount="$45.00"
            isPositive={true}
          />
          <TransactionItem
            name="Alice Smith"
            description="Dinner Bill"
            time="Yesterday"
            amount="$85.50"
            isPositive={false}
            avatarColor={Colors.light.accentOrange}
          />
          <TransactionItem
            name="Mike K."
            description="Rent Share"
            time="2 days ago"
            amount="$650.00"
            isPositive={true}
            avatarColor={Colors.light.accentTeal}
          />
          <TransactionItem
            name="Sarah R."
            description="Utilities"
            time="5 days ago"
            amount="$120.00"
            isPositive={true}
            avatarColor={Colors.light.accent}
          />
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
});

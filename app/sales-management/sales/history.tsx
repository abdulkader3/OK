import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { useSales } from '@/src/contexts/SalesContext';
import { EmptyState } from '@/src/components/sales';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SalesHistoryScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { sales, deleteSale, isLoading } = useSales();

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      t('sales.deleteConfirmTitle'),
      t('sales.deleteSaleConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive',
          onPress: () => deleteSale(id),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('sales.salesHistory')}</Text>
        </View>

        {sales.length === 0 ? (
          <EmptyState
            icon="receipt-long"
            title={t('sales.noSales')}
            description={t('sales.noSalesDescription')}
          />
        ) : (
          <FlatList
            data={sales}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.saleCard}
                onPress={() => router.push(`/sales-management/sales/${item._id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.saleHeader}>
                  <View style={styles.saleInfo}>
                    <Text style={styles.saleTotal}>{formatCurrency(item.totalAmount || item.total || 0)}</Text>
                    <Text style={styles.saleDate}>{formatDate(item.createdAt)}</Text>
                  </View>
                  <View style={styles.saleActions}>
                    {item.ledgerName && (
                      <View style={styles.ledgerBadge}>
                        <MaterialIcons name="person" size={14} color={Colors.light.primaryMuted} />
                        <Text style={styles.ledgerName} numberOfLines={1}>{item.ledgerName}</Text>
                      </View>
                    )}
                    <TouchableOpacity 
                      onPress={() => handleDelete(item._id)}
                      style={styles.deleteBtn}
                    >
                      <MaterialIcons name="delete-outline" size={20} color={Colors.light.error} />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.itemCount}>
                  {item.items.length} {item.items.length === 1 ? 'item' : 'items'}
                </Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.light.text,
  },
  listContent: {
    padding: Spacing.lg,
  },
  separator: {
    height: Spacing.md,
  },
  saleCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  saleInfo: {
    flex: 1,
  },
  saleTotal: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.light.primary,
    marginBottom: Spacing.xs,
  },
  saleDate: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
  },
  saleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  ledgerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.light.backgroundAlt,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  ledgerName: {
    fontSize: FontSize.xs,
    color: Colors.light.textSecondary,
    maxWidth: 100,
  },
  deleteBtn: {
    padding: Spacing.xs,
  },
  itemCount: {
    fontSize: FontSize.sm,
    color: Colors.light.textMuted,
    marginTop: Spacing.sm,
  },
});
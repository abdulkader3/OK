import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { useSales, SaleItem as SaleItemType } from '@/src/contexts/SalesContext';
import { EmptyState, ProductCard, SaleItemRow, TotalSummaryBar } from '@/src/components/sales';
import { getLedgers, Ledger } from '@/src/services/ledgerService';
import { Image } from 'expo-image';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useState, useMemo, useEffect } from 'react';
import { Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface CartItem extends SaleItemType {
  productId: string;
}

export default function AddSaleScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { products, addSale, sales } = useSales();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [selectedLedger, setSelectedLedger] = useState<{ id: string; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [serverLedgers, setServerLedgers] = useState<Ledger[]>([]);
  const [loadingLedgers, setLoadingLedgers] = useState(false);

  // Fetch ledgers from server when modal opens
  useEffect(() => {
    if (showLedgerModal) {
      loadLedgers();
    }
  }, [showLedgerModal]);

  const loadLedgers = async () => {
    setLoadingLedgers(true);
    try {
      const response = await getLedgers({ limit: 100 });
      // Filter to only "owes_me" type ledgers (customers who owe us)
      const customerLedgers = response.ledgers.filter(
        (l: Ledger) => l.type === 'owes_me'
      );
      setServerLedgers(customerLedgers);
    } catch (error) {
      console.error('Failed to load ledgers:', error);
    } finally {
      setLoadingLedgers(false);
    }
  };

  const ledgers = useMemo(() => {
    // Use server ledgers if available, fallback to local for offline
    if (serverLedgers.length > 0) {
      return serverLedgers.map(l => ({ id: l._id, name: l.counterpartyName }));
    }
    // Fallback: extract from local sales (for offline support)
    const ledgerMap = new Map<string, { id: string; name: string }>();
    sales.forEach(sale => {
      if (sale.ledgerId && sale.ledgerName) {
        ledgerMap.set(sale.ledgerId, { id: sale.ledgerId, name: sale.ledgerName });
      }
    });
    return Array.from(ledgerMap.values());
  }, [serverLedgers, sales]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cart]);

  const addToCart = (product: typeof products[0]) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product._id);
      if (existing) {
        return prev.map(item => 
          item.productId === product._id 
            ? { 
                ...item, 
                quantity: item.quantity + 1, 
                subtotal: (item.quantity + 1) * item.productPrice 
              }
            : item
        );
      }
      return [...prev, {
        productId: product._id,
        productName: product.name,
        productPrice: product.price,
        quantity: 1,
        subtotal: product.price,
      }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.productId === productId) {
          const newQuantity = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQuantity, subtotal: newQuantity * item.productPrice };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const handleSaveSale = async () => {
    if (cart.length === 0) {
      Alert.alert(t('sales.error'), t('sales.noItemsInCart'));
      return;
    }

    await addSale({
      items: cart.map(({ productId, productName, productPrice, quantity, subtotal }) => ({
        productId,
        productName,
        productPrice,
        quantity,
        subtotal,
      })),
      total,
      ledgerId: selectedLedger?.id,
      ledgerName: selectedLedger?.name,
    });

    Alert.alert(t('sales.success'), t('sales.saleSaved'), [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  const handleCancel = () => {
    if (cart.length > 0) {
      Alert.alert(t('sales.unsavedCart'), t('sales.discardCart'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.discard'), style: 'destructive', onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={handleCancel} 
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <MaterialIcons name="close" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('sales.addSale')}</Text>
          <TouchableOpacity 
            onPress={() => setShowLedgerModal(true)}
            style={[styles.ledgerButton, selectedLedger && styles.ledgerButtonActive]}
            activeOpacity={0.7}
          >
            <MaterialIcons 
              name="person" 
              size={20} 
              color={selectedLedger ? Colors.light.primary : Colors.light.textMuted} 
            />
          </TouchableOpacity>
        </View>

        {products.length === 0 ? (
          <EmptyState
            icon="inventory-2"
            title={t('sales.noProducts')}
            description={t('sales.addProductsFirst')}
          />
        ) : (
          <View style={styles.content}>
            <View style={styles.searchContainer}>
              <MaterialIcons name="search" size={20} color={Colors.light.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder={t('sales.searchProducts')}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={Colors.light.textMuted}
              />
            </View>

            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item._id}
              numColumns={2}
              contentContainerStyle={styles.productGrid}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.productItem}
                  onPress={() => addToCart(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.productImageContainer}>
                    {item.imageUri || item.imageUrl ? (
                      <Image source={{ uri: item.imageUri || item.imageUrl }} style={styles.productImage} contentFit="cover" />
                    ) : (
                      <View style={styles.productImagePlaceholder}>
                        <MaterialIcons name="inventory-2" size={24} color={Colors.light.textMuted} />
                      </View>
                    )}
                  </View>
                  <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.productPrice}>{formatCurrency(item.price)}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {cart.length > 0 && (
          <View style={styles.cartPanel}>
            <Text style={styles.cartTitle}>{t('sales.selectedItems')} ({cart.length})</Text>
            <ScrollView style={styles.cartItems}>
              {cart.map(item => (
                <SaleItemRow
                  key={item.productId}
                  name={item.productName}
                  price={item.productPrice}
                  quantity={item.quantity}
                  onIncrement={() => updateQuantity(item.productId, 1)}
                  onDecrement={() => updateQuantity(item.productId, -1)}
                />
              ))}
            </ScrollView>
            <TotalSummaryBar
              total={total}
              buttonText={t('sales.saveSale')}
              onButtonPress={handleSaveSale}
            />
          </View>
        )}

        <Modal
          visible={showLedgerModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowLedgerModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('sales.selectCustomer')}</Text>
                <TouchableOpacity onPress={() => setShowLedgerModal(false)}>
                  <MaterialIcons name="close" size={24} color={Colors.light.text} />
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                style={[styles.ledgerOption, !selectedLedger && styles.ledgerOptionSelected]}
                onPress={() => { setSelectedLedger(null); setShowLedgerModal(false); }}
                activeOpacity={0.7}
              >
                <MaterialIcons name="money-off" size={20} color={Colors.light.textSecondary} />
                <Text style={styles.ledgerOptionText}>{t('sales.noCustomer')}</Text>
              </TouchableOpacity>

              {ledgers.map(ledger => (
                <TouchableOpacity 
                  key={ledger.id}
                  style={[styles.ledgerOption, selectedLedger?.id === ledger.id && styles.ledgerOptionSelected]}
                  onPress={() => { setSelectedLedger(ledger); setShowLedgerModal(false); }}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="person" size={20} color={Colors.light.primary} />
                  <Text style={styles.ledgerOptionText}>{ledger.name}</Text>
                </TouchableOpacity>
              ))}

              {ledgers.length === 0 && (
                <Text style={styles.noLedgers}>{t('sales.noPreviousCustomers')}</Text>
              )}
            </View>
          </View>
        </Modal>
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.light.text,
  },
  ledgerButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.backgroundAlt,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  ledgerButtonActive: {
    backgroundColor: Colors.light.primary + '12',
    borderColor: Colors.light.primary,
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.light.text,
  },
  productGrid: {
    padding: Spacing.lg,
  },
  productItem: {
    flex: 1,
    margin: Spacing.xs,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    maxWidth: '48%',
  },
  productImageContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
    backgroundColor: Colors.light.backgroundAlt,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  productPrice: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.light.primary,
  },
  cartPanel: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
    maxHeight: '40%',
  },
  cartTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.light.text,
    padding: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  cartItems: {
    paddingHorizontal: Spacing.lg,
    maxHeight: 200,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.light.text,
  },
  ledgerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.light.backgroundAlt,
    marginBottom: Spacing.sm,
  },
  ledgerOptionSelected: {
    backgroundColor: Colors.light.primary + '18',
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  ledgerOptionText: {
    fontSize: FontSize.md,
    color: Colors.light.text,
  },
  noLedgers: {
    textAlign: 'center',
    color: Colors.light.textMuted,
    padding: Spacing.xl,
  },
});
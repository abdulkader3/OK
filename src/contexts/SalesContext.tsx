import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { 
  addToSyncQueue, 
  syncSalesBatch, 
  getPendingCount, 
  addPendingUpload,
  getLastSyncTime,
  retryFailed,
  getSyncQueue,
  getIdMapping 
} from '@/src/services/salesSyncService';
import apiClient from '@/src/services/apiClient';

export type SyncStatus = 'synced' | 'pending' | 'failed';

export interface Product {
  _id: string;
  serverId?: string;
  clientTempId?: string;
  name: string;
  price: number;
  imageUri?: string;
  imageUrl?: string;
  syncStatus: SyncStatus;
  idempotencyKey?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SaleItem {
  productId?: string;
  productName: string;
  productPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Sale {
  _id: string;
  serverId?: string;
  clientTempId?: string;
  items: SaleItem[];
  total: number;
  totalAmount?: number;  // Server returns totalAmount
  ledgerId?: string;
  ledgerName?: string;
  ledgerDebtId?: string;
  ledgerTxnId?: string;
  syncStatus: SyncStatus;
  idempotencyKey?: string;
  recordedAtClient?: string;
  createdAt: string;
  updatedAt?: string;
}

interface SalesContextType {
  products: Product[];
  sales: Sale[];
  addProduct: (product: Omit<Product, '_id' | 'clientTempId' | 'syncStatus' | 'idempotencyKey' | 'createdAt'>) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProduct: (id: string) => Product | undefined;
  addSale: (sale: Omit<Sale, '_id' | 'clientTempId' | 'syncStatus' | 'idempotencyKey' | 'recordedAtClient' | 'createdAt'>) => Promise<Sale>;
  deleteSale: (id: string) => void;
  getSale: (id: string) => Sale | undefined;
  isLoading: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: string | null;
  syncAll: () => Promise<void>;
  retryFailed: () => Promise<void>;
  fetchFromServer: (currentProducts?: Product[], currentSales?: Sale[]) => Promise<void>;
  getTodaySalesTotal: () => number;
  getSalesTotalForDays: (days: number) => number;
}

const STORAGE_KEYS = {
  PRODUCTS: '@sales_products',
  SALES: '@sales_sales',
};

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export function SalesProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    updatePendingCount();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      fetchFromServer();
    }
  }, [isLoading]);

  const syncAllRef = useRef<(() => Promise<void>) | null>(null);

  const isOfflineRef = useRef<boolean | null>(null);

  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerDebouncedSync = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    syncTimeoutRef.current = setTimeout(() => {
      if (syncAllRef.current && !isSyncing) {
        syncAllRef.current().catch((error) => {
          console.error('[SalesContext] Debounced sync failed:', error);
        });
      }
    }, 1500);
  }, [isSyncing]);

  useEffect(() => {
    const unsubscribeNetInfo = NetInfo.addEventListener((state: NetInfoState) => {
      const wasOffline = isOfflineRef.current;
      const isNowOnline = state.isConnected === true && state.isInternetReachable !== false;
      
      isOfflineRef.current = !isNowOnline;

      if (wasOffline === true && isNowOnline && !isLoading && syncAllRef.current) {
        syncAllRef.current().catch((error) => {
          console.error('[SalesContext] Network sync failed:', error);
        });
      }
    });

    NetInfo.fetch().then((state: NetInfoState) => {
      isOfflineRef.current = !(state.isConnected === true && state.isInternetReachable !== false);
    });

    return () => {
      unsubscribeNetInfo();
    };
  }, [isLoading]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && !isLoading && syncAllRef.current) {
        syncAllRef.current().catch((error) => {
          console.error('[SalesContext] App state sync failed:', error);
        });
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [isLoading]);

  const loadData = async () => {
    try {
      const [productsData, salesData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.PRODUCTS),
        AsyncStorage.getItem(STORAGE_KEYS.SALES),
      ]);
      
      if (productsData) {
        setProducts(JSON.parse(productsData));
      }
      if (salesData) {
        setSales(JSON.parse(salesData));
      }
    } catch (error) {
      console.error('Failed to load sales data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePendingCount = async () => {
    const count = await getPendingCount();
    setPendingCount(count);
  };

  const saveProducts = async (newProducts: Product[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(newProducts));
    } catch (error) {
      console.error('Failed to save products:', error);
    }
  };

  const saveSales = async (newSales: Sale[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(newSales));
    } catch (error) {
      console.error('Failed to save sales:', error);
    }
  };

  const generateIdempotencyKey = () => {
    return `idem-${uuidv4()}`;
  };

  const addProduct = async (productData: Omit<Product, '_id' | 'clientTempId' | 'syncStatus' | 'idempotencyKey' | 'createdAt'>): Promise<Product> => {
    const clientTempId = uuidv4();
    const idempotencyKey = generateIdempotencyKey();
    const now = new Date().toISOString();
    
    const newProduct: Product = {
      ...productData,
      _id: clientTempId,
      clientTempId,
      syncStatus: 'pending',
      idempotencyKey,
      createdAt: now,
    };

    const imageUrl = productData.imageUri 
      ? await uploadProductImage(productData.imageUri, clientTempId) 
      : undefined;

    const productWithImage = imageUrl ? { ...newProduct, imageUrl } : newProduct;

    // Add to local storage immediately
    const newProducts = [...products, productWithImage];
    setProducts(newProducts);
    await saveProducts(newProducts);

    // Add to sync queue
    await addToSyncQueue({
      type: 'product',
      clientTempId,
      idempotencyKey,
      data: {
        name: productWithImage.name,
        price: productWithImage.price,
        imageUrl: productWithImage.imageUrl,
      },
      status: 'pending',
    });

    await updatePendingCount();

    triggerDebouncedSync();

    return productWithImage;
  };

  const uploadProductImage = async (localUri: string, productId: string): Promise<string | undefined> => {
    try {
      // For now, we'll store the local URI and queue for upload
      // The actual upload happens during sync
      await addPendingUpload({
        id: uuidv4(),
        localUri,
        targetType: 'product',
        targetId: productId,
        status: 'pending',
      });
      // Return null for now - the server will assign the URL after upload
      return undefined;
    } catch (error) {
      console.error('Failed to queue image upload:', error);
      return undefined;
    }
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const newProducts = products.map(p => 
      p._id === id ? { ...p, ...updates } : p
    );
    setProducts(newProducts);
    saveProducts(newProducts);
  };

  const deleteProduct = (id: string) => {
    const newProducts = products.filter(p => p._id !== id);
    setProducts(newProducts);
    saveProducts(newProducts);
  };

  const getProduct = (id: string): Product | undefined => {
    return products.find(p => p._id === id);
  };

  const addSale = async (saleData: Omit<Sale, '_id' | 'clientTempId' | 'syncStatus' | 'idempotencyKey' | 'recordedAtClient' | 'createdAt'>): Promise<Sale> => {
    const clientTempId = uuidv4();
    const idempotencyKey = generateIdempotencyKey();
    const now = new Date().toISOString();
    
    const newSale: Sale = {
      ...saleData,
      _id: clientTempId,
      clientTempId,
      syncStatus: 'pending',
      idempotencyKey,
      recordedAtClient: now,
      createdAt: now,
    };

    // Add to local storage immediately
    const newSales = [newSale, ...sales];
    setSales(newSales);
    await saveSales(newSales);

    // Add to sync queue
    // Transform items to match backend expected format (name/price instead of productName/productPrice)
    const syncItems = newSale.items.map(item => ({
      name: item.productName,
      price: item.productPrice,
      quantity: item.quantity,
      subtotal: item.subtotal,
    }));
    
    await addToSyncQueue({
      type: 'sale',
      clientTempId,
      idempotencyKey,
      data: {
        totalAmount: newSale.total,
        items: syncItems,
        ledgerId: newSale.ledgerId,
        ledgerName: newSale.ledgerName,
        recordedAtClient: now,
      },
      status: 'pending',
    });

    await updatePendingCount();

    triggerDebouncedSync();

    return newSale;
  };

  const deleteSale = (id: string) => {
    const newSales = sales.filter(s => s._id !== id);
    setSales(newSales);
    saveSales(newSales);
  };

  const getSale = (id: string): Sale | undefined => {
    return sales.find(s => s._id === id);
  };

  const syncAll = useCallback(async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    try {
      // Step 1: Sync pending items
      const syncResult = await syncSalesBatch();
      await updatePendingCount();
      
      // Step 2: Apply server-assigned IDs to local records (persist first)
      // Use current products/sales from state (not stale closure)
      let updatedProducts = [...products];
      let updatedSales = [...sales];
      
      if (syncResult.success && syncResult.results.length > 0) {
        
        for (const result of syncResult.results) {
          if (result.success && result.serverAssignedId) {
            if (result.type === 'product') {
              // Find by clientTempId or _id (temp UUID)
              const idx = updatedProducts.findIndex(
                p => p.clientTempId === result.clientTempId || p._id === result.clientTempId
              );
              if (idx >= 0) {
                updatedProducts[idx] = {
                  ...updatedProducts[idx],
                  _id: result.serverAssignedId,
                  serverId: result.serverAssignedId,
                  syncStatus: 'synced',
                  clientTempId: result.clientTempId
                };
              }
            } else if (result.type === 'sale') {
              const idx = updatedSales.findIndex(
                s => s.clientTempId === result.clientTempId || s._id === result.clientTempId
              );
              if (idx >= 0) {
                updatedSales[idx] = {
                  ...updatedSales[idx],
                  _id: result.serverAssignedId,
                  serverId: result.serverAssignedId,
                  syncStatus: 'synced',
                  clientTempId: result.clientTempId,
                  // Handle ledgerDebtId for credit sales (server returns ledgerDebtId)
                  ...(result.ledgerDebtId && { 
                    ledgerDebtId: result.ledgerDebtId,
                    ledgerId: result.ledgerDebtId 
                  }),
                };
              }
            }
          }
        }
        
        // Persist updated local records before fetchFromServer
        setProducts(updatedProducts);
        await saveProducts(updatedProducts);
        setSales(updatedSales);
        await saveSales(updatedSales);
      }
      
      const syncTime = await getLastSyncTime();
      setLastSyncTime(syncTime);
      
      // Step 3: Fetch from server and merge (pass updated data to avoid stale closure)
      await fetchFromServer(updatedProducts, updatedSales);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, products, sales]);

  syncAllRef.current = syncAll;

  const handleRetryFailed = useCallback(async () => {
    await retryFailed();
    await syncAll();
  }, [syncAll]);

  const fetchFromServer = useCallback(async (currentProducts?: Product[], currentSales?: Sale[]) => {
    // Use passed parameters if available, otherwise use closure values
    const localProducts = currentProducts ?? products;
    const localSales = currentSales ?? sales;
    try {
      // Get last sync timestamp for incremental sync
      const lastSync = await getLastSyncTime();
      const sinceParam = lastSync ? `&since=${encodeURIComponent(lastSync)}` : '';
      
      // Fetch products
      const productsResponse = await apiClient.get<{ products: Product[] }>(`/api/products?page=1&limit=100${sinceParam}`);
      if (productsResponse.success && productsResponse.data?.products) {
        const serverProducts = productsResponse.data.products.map(p => ({
          ...p,
          _id: p._id,
          serverId: p._id,
          syncStatus: 'synced' as SyncStatus,
        }));
        
        // Only keep local items that are NOT synced (pending/failed) 
        // AND are NOT already on server (check by clientTempId mapping)
        const idMapping = await getIdMapping();
        const localPending = localProducts.filter(p => {
          if (p.syncStatus === 'synced') return false; // Already synced, don't include
          
          // Check if this item was synced (has server ID in mapping)
          const wasSynced = p.clientTempId && p.clientTempId in idMapping;
          return !wasSynced;
        });
        
        // Merge: local pending + unique server items
        // But we also need to include locally synced products (they're already in the products array)
        const serverProductIds = new Set(serverProducts.map(p => p._id));
        
        // Keep local synced products that don't exist on server
        const localSyncedProducts = localProducts.filter(p => 
          p.syncStatus === 'synced' && !serverProductIds.has(p._id)
        );
        
        const mergedProducts = [...localPending, ...localSyncedProducts, ...serverProducts];
        
        setProducts(mergedProducts);
        await saveProducts(mergedProducts);
      }

      // Fetch sales
      const salesResponse = await apiClient.get<any>(`/api/sales?page=1&limit=100${sinceParam}`);
      if (salesResponse.success && salesResponse.data?.sales) {
        // Map server sales to local format (handle field name differences)
        const serverSales = (salesResponse.data.sales as any[]).map((s: any) => ({
          ...s,
          total: s.totalAmount,  // Server returns totalAmount, local expects total
          items: s.items?.map((item: any) => ({
            productId: item.clientProductId || item.productId,
            productName: item.name,
            productPrice: item.price,
            quantity: item.quantity,
            subtotal: item.subtotal,
          })),
          _id: s._id,
          serverId: s._id,
          syncStatus: 'synced' as SyncStatus,
        }));
        
        // Create a set of server IDs to check for duplicates
        const serverSaleIds = new Set(serverSales.map(s => s._id));
        
        // Only keep local pending items that weren't synced
        const idMapping = await getIdMapping();
        const localPending = localSales.filter(s => {
          if (s.syncStatus === 'synced') return false;
          
          const wasSynced = s.clientTempId && s.clientTempId in idMapping;
          return !wasSynced;
        });
        
        // Keep local synced sales that don't exist on server
        const localSyncedSales = localSales.filter(s => 
          s.syncStatus === 'synced' && !serverSaleIds.has(s._id)
        );
        
        const mergedSales = [...localPending, ...localSyncedSales, ...serverSales];
        
        setSales(mergedSales);
        await saveSales(mergedSales);
      }

      const syncTime = await getLastSyncTime();
      setLastSyncTime(syncTime);
    } catch (error) {
      console.error('Failed to fetch from server:', error);
    }
  }, [products, sales]);

      // Load last sync time on mount
      useEffect(() => {
        const loadLastSync = async () => {
          const syncTime = await getLastSyncTime();
          setLastSyncTime(syncTime);
        };
        loadLastSync();
      }, []);

      const getTodaySalesTotal = useCallback(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return sales
          .filter(s => new Date(s.createdAt) >= today)
          .reduce((sum, s) => sum + (s.totalAmount || s.total || 0), 0);
      }, [sales]);

      const getSalesTotalForDays = useCallback((days: number) => {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);
        
        return sales
          .filter(s => new Date(s.createdAt) >= startDate)
          .reduce((sum, s) => sum + (s.totalAmount || s.total || 0), 0);
      }, [sales]);

      return (
        <SalesContext.Provider value={{
          products,
          sales,
          addProduct,
          updateProduct,
          deleteProduct,
          getProduct,
          addSale,
          deleteSale,
          getSale,
          isLoading,
          isSyncing,
          pendingCount,
          lastSyncTime,
          syncAll,
          retryFailed: handleRetryFailed,
          fetchFromServer,
          getTodaySalesTotal,
          getSalesTotalForDays,
        }}>
          {children}
        </SalesContext.Provider>
      );
    }

export function useSales() {
  const context = useContext(SalesContext);
  if (!context) {
    throw new Error('useSales must be used within a SalesProvider');
  }
  return context;
}
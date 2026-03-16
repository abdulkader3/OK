import apiClient, { ApiResponse } from './apiClient';

export type SyncStatus = 'synced' | 'pending' | 'failed';

export interface Product {
  _id: string;
  clientTempId?: string;
  name: string;
  price: number;
  imageUrl?: string;
  imageUri?: string;
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
  clientTempId?: string;
  items: SaleItem[];
  total: number;
  ledgerId?: string;
  ledgerName?: string;
  ledgerDebtId?: string;
  syncStatus: SyncStatus;
  idempotencyKey?: string;
  recordedAtClient?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateProductRequest {
  name: string;
  price: number;
  imageUrl?: string;
  clientTempId: string;
  idempotencyKey: string;
}

export interface CreateSaleRequest {
  totalAmount: number;
  items: SaleItem[];
  ledgerId?: string;
  ledgerCounterpartyName?: string;
  clientTempId: string;
  idempotencyKey: string;
  recordedAtClient?: string;
  note?: string;
}

export interface SyncOperation {
  type: 'product' | 'sale';
  clientTempId: string;
  idempotencyKey: string;
  name?: string;
  price?: number;
  imageUrl?: string;
  totalAmount?: number;
  items?: SaleItem[];
  ledgerId?: string;
  recordedAtClient?: string;
}

export interface SyncBatchRequest {
  operations: SyncOperation[];
}

export interface SyncResult {
  clientTempId: string;
  success: boolean;
  serverAssignedId?: string;
  error?: string;
}

export interface SyncBatchResponse {
  success: boolean;
  data?: {
    results: SyncResult[];
    processed: number;
    failed: number;
  };
  message?: string;
}

export interface SyncStatusResponse {
  success: boolean;
  data?: {
    syncTimestamp: string;
    products?: Product[];
    sales?: Sale[];
  };
}

// Products API
export async function createProduct(product: CreateProductRequest): Promise<ApiResponse<{ product: Product }>> {
  return apiClient.post<{ product: Product }>('/api/products', product);
}

export async function getProducts(page = 1, limit = 50): Promise<ApiResponse<{ products: Product[]; total: number }>> {
  return apiClient.get<{ products: Product[]; total: number }>(`/api/products?page=${page}&limit=${limit}`);
}

export async function getProduct(id: string): Promise<ApiResponse<{ product: Product }>> {
  return apiClient.get<{ product: Product }>(`/api/products/${id}`);
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<ApiResponse<{ product: Product }>> {
  return apiClient.put<{ product: Product }>(`/api/products/${id}`, updates);
}

export async function deleteProduct(id: string): Promise<ApiResponse<{ success: boolean }>> {
  return apiClient.delete<{ success: boolean }>(`/api/products/${id}`);
}

// Sales API
export async function createSale(sale: CreateSaleRequest): Promise<ApiResponse<{ sale: Sale; ledgerDebtCreated?: boolean }>> {
  return apiClient.post<{ sale: Sale; ledgerDebtCreated?: boolean }>('/api/sales', sale);
}

export async function getSales(page = 1, limit = 50): Promise<ApiResponse<{ sales: Sale[]; total: number }>> {
  return apiClient.get<{ sales: Sale[]; total: number }>(`/api/sales?page=${page}&limit=${limit}`);
}

export async function getSale(id: string): Promise<ApiResponse<{ sale: Sale }>> {
  return apiClient.get<{ sale: Sale }>(`/api/sales/${id}`);
}

// Upload API
export async function uploadReceipt(imageUri: string): Promise<ApiResponse<{ url: string; publicId: string }>> {
  const formData = new FormData();
  
  // Get the file extension from the URI
  const uriParts = imageUri.split('.');
  const extension = uriParts[uriParts.length - 1] || 'jpg';
  const mimeType = `image/${extension === 'jpg' ? 'jpeg' : extension}`;
  
  // Backend expects field name "file" (not "receipt")
  formData.append('file', {
    uri: imageUri,
    type: mimeType,
    name: `receipt_${Date.now()}.${extension}`,
  } as any);

  return apiClient.post<{ url: string; publicId: string }>('/api/uploads/receipt', formData);
}

// Sync API
export async function syncBatch(batch: SyncBatchRequest): Promise<ApiResponse<SyncBatchResponse>> {
  return apiClient.post<SyncBatchResponse>('/api/sync/batch', batch);
}

export async function getSyncStatus(since?: string): Promise<ApiResponse<SyncStatusResponse>> {
  const endpoint = since ? `/api/sync/status?since=${encodeURIComponent(since)}` : '/api/sync/status';
  return apiClient.get<SyncStatusResponse>(endpoint);
}

// Seed data API (for dev testing)
export async function seedData(data: { products?: CreateProductRequest[]; sales?: CreateSaleRequest[] }): Promise<ApiResponse<{ success: boolean }>> {
  return apiClient.post<{ success: boolean }>('/api/dev/seed', data);
}
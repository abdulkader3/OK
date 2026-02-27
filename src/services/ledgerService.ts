// eslint-disable-next-line import/no-named-as-default
import apiClient from './apiClient';

export interface Ledger {
  _id: string;
  ownerId: string;
  type: 'owes_me' | 'i_owe';
  counterpartyName: string;
  counterpartyContact?: string;
  initialAmount: number;
  outstandingBalance: number;
  currency: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  tags: string[];
  attachments: string[];
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateLedgerData {
  type: 'owes_me' | 'i_owe';
  counterpartyName: string;
  counterpartyContact?: string;
  initialAmount: number;
  currency?: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
  tags?: string[];
}

export interface LedgerFilters {
  page?: number;
  limit?: number;
  type?: 'owes_me' | 'i_owe';
  priority?: 'low' | 'medium' | 'high';
  dueDateFrom?: string;
  dueDateTo?: string;
  search?: string;
}

export interface LedgersResponse {
  ledgers: Ledger[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export async function createLedger(data: CreateLedgerData): Promise<Ledger> {
  const response = await apiClient.post<{ ledger: Ledger }>('/api/ledgers', data);
  if (response.success && response.data?.ledger) {
    return response.data.ledger;
  }
  throw new Error(response.message || 'Failed to create ledger');
}

export async function getLedgers(filters?: LedgerFilters): Promise<LedgersResponse> {
  const params = new URLSearchParams();
  if (filters) {
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.type) params.append('type', filters.type);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.dueDateFrom) params.append('dueDateFrom', filters.dueDateFrom);
    if (filters.dueDateTo) params.append('dueDateTo', filters.dueDateTo);
    if (filters.search) params.append('search', filters.search);
  }
  const queryString = params.toString();
  const endpoint = queryString ? `/api/ledgers?${queryString}` : '/api/ledgers';
  
  const response = await apiClient.get<LedgersResponse>(endpoint);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.message || 'Failed to fetch ledgers');
}

export async function getLedgerById(id: string): Promise<Ledger> {
  const response = await apiClient.get<{ ledger: Ledger }>(`/api/ledgers/${id}`);
  if (response.success && response.data?.ledger) {
    return response.data.ledger;
  }
  throw new Error(response.message || 'Failed to fetch ledger');
}

export async function deleteLedger(id: string): Promise<void> {
  const response = await apiClient.delete(`/api/ledgers/${id}`);
  if (!response.success) {
    throw new Error(response.message || 'Failed to delete ledger');
  }
}

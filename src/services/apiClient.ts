import Constants from 'expo-constants';

const { API_URL } = Constants.expoConfig?.extra || {};

const BASE_URL = API_URL || process.env.REACT_APP_API_URL || 'http://localhost:4000';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface RequestOptions extends RequestInit {
  idempotencyKey?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { idempotencyKey, ...fetchOptions } = options;

    const headers: HeadersInit = {
      ...fetchOptions.headers,
    };

    if (idempotencyKey) {
      (headers as Record<string, string>)['Idempotency-Key'] = idempotencyKey;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...fetchOptions,
      headers,
      credentials: 'include',
    });

    const data = await response.json().catch(() => ({ success: false, message: 'Request failed' }));

    if (!response.ok) {
      if (response.status === 401) {
        console.warn('Unauthorized - cookies may have expired');
      }
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    return data as ApiResponse<T>;
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async postWithIdempotency<T>(
    endpoint: string,
    body: unknown,
    idempotencyKey: string
  ): Promise<ApiResponse<T>> {
    return this.post<T>(endpoint, body, { idempotencyKey });
  }

  async put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(BASE_URL);
export default apiClient;

import Constants from 'expo-constants';
import apiClient from './apiClient';

const { API_URL } = Constants.expoConfig?.extra || {};

const BASE_URL = API_URL || process.env.REACT_APP_API_URL || 'http://localhost:4000';

export interface UploadResponse {
  success: boolean;
  data: {
    url: string;
    publicId: string;
  };
  message: string;
}

export async function uploadReceipt(uri: string): Promise<UploadResponse> {
  const formData = new FormData();

  const filename = uri.split('/').pop() || 'receipt.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('file', {
    uri,
    name: filename,
    type,
  } as unknown as string);

  const response = await apiClient.post<UploadResponse>('/api/uploads/receipt', formData);
  
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.message || 'Upload failed');
}

export default uploadReceipt;

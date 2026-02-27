import Constants from 'expo-constants';

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

  const response = await fetch(`${BASE_URL}/api/uploads/receipt`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export default uploadReceipt;

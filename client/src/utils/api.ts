import axios, { AxiosInstance, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add any auth tokens here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 429) {
      toast.error('Too many requests. Please try again later.');
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout. Please try again.');
    } else if (!error.response) {
      toast.error('Network error. Please check your connection.');
    }
    
    return Promise.reject(error);
  }
);

// Export functions for different API endpoints
export const analysisAPI = {
  startAnalysis: (url: string, mockMode: boolean = false) => apiClient.post('/api/analyze', { url, mockMode }),
  checkStatus: (jobId: string) => apiClient.get(`/api/analyze/status/${jobId}`),
  getResults: (jobId: string, params?: Record<string, unknown>) => apiClient.get(`/api/results/${jobId}`, { params }),
  getSummary: (jobId: string) => apiClient.get(`/api/results/${jobId}/summary`),
  getComments: (jobId: string, params?: Record<string, unknown>) => apiClient.get(`/api/results/${jobId}/comments`, { params }),
};

export const exportAPI = {
  exportCSV: (jobId: string) => apiClient.get(`/api/export/${jobId}/csv`, { responseType: 'blob' }),
  exportExcel: (jobId: string) => apiClient.get(`/api/export/${jobId}/excel`, { responseType: 'blob' }),
  exportJSON: (jobId: string) => apiClient.get(`/api/export/${jobId}/json`),
  exportPDF: (jobId: string) => apiClient.get(`/api/export/${jobId}/pdf`, { responseType: 'blob' }),
};

export const healthAPI = {
  checkHealth: () => apiClient.get('/health'),
};

export default apiClient;

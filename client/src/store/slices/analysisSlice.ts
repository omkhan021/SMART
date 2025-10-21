import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AnalysisState, AnalysisJob, AnalysisResults, ApiError } from '@/types';
import apiClient from '@/utils/api';

// Async thunks
export const startAnalysis = createAsyncThunk(
  'analysis/startAnalysis',
  async ({ url, mockMode = false, refreshData = false }: { url: string; mockMode?: boolean; refreshData?: boolean }, { rejectWithValue }) => {
    try {
      console.log('🔄 Redux: Starting analysis for URL:', url, 'Mock Mode:', mockMode, 'Refresh Data:', refreshData);
      const response = await apiClient.post('/api/analyze', { url, mockMode, refreshData });
      console.log('✅ Redux: Analysis started successfully:', response.data);
      
      // Map backend response to frontend AnalysisJob interface
      const jobData = {
        id: response.data.jobId,
        status: response.data.status,
        progress: 0,
        totalComments: 0,
        processedComments: 0,
        errorMessage: undefined,
        startedAt: undefined,
        completedAt: undefined
      };
      
      console.log('🔄 Redux: Mapped job data:', jobData);
      console.log('🔄 Redux: Job ID:', jobData.id);
      return jobData;
    } catch (error: unknown) {
      console.error('❌ Redux: Analysis failed:', error);
      const axiosError = error as { response?: { data?: ApiError; status?: number } };
      console.error('❌ Redux: Error response:', axiosError.response?.data);
      console.error('❌ Redux: Error status:', axiosError.response?.status);
      return rejectWithValue(axiosError.response?.data || { error: 'Failed to start analysis' });
    }
  }
);

export const checkAnalysisStatus = createAsyncThunk(
  'analysis/checkStatus',
  async (jobId: string, { rejectWithValue }) => {
    console.log('🔄 Redux: Checking status for job ID:', jobId);
    try {
      const response = await apiClient.get(`/api/analyze/status/${jobId}`);
      
      // Map server response to frontend interface
      const jobData = {
        id: response.data.jobId,
        status: response.data.status,
        progress: response.data.progress,
        totalComments: response.data.totalComments,
        processedComments: response.data.processedComments,
        errorMessage: response.data.errorMessage,
        startedAt: response.data.startedAt,
        completedAt: response.data.completedAt
      };
      
      return jobData;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: ApiError } };
      return rejectWithValue(axiosError.response?.data || { error: 'Failed to check status' });
    }
  }
);

export const fetchAnalysisResults = createAsyncThunk(
  'analysis/fetchResults',
  async (jobId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/api/results/${jobId}`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: ApiError } };
      return rejectWithValue(axiosError.response?.data || { error: 'Failed to fetch results' });
    }
  }
);

export const fetchAnalysisSummary = createAsyncThunk(
  'analysis/fetchSummary',
  async (jobId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/api/results/${jobId}/summary`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: ApiError } };
      return rejectWithValue(axiosError.response?.data || { error: 'Failed to fetch summary' });
    }
  }
);

export const fetchComments = createAsyncThunk(
  'analysis/fetchComments',
  async ({ jobId, params }: { jobId: string; params?: Record<string, unknown> }, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/api/results/${jobId}/comments`, { params });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: ApiError } };
      return rejectWithValue(axiosError.response?.data || { error: 'Failed to fetch comments' });
    }
  }
);

// Initial state
const initialState: AnalysisState = {
  currentJob: null,
  results: null,
  isLoading: false,
  error: null,
  progress: {
    percentage: 0,
    message: ''
  }
};

// Slice
const analysisSlice = createSlice({
  name: 'analysis',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearResults: (state) => {
      state.results = null;
      state.currentJob = null;
      state.progress = { percentage: 0, message: '' };
    },
    updateProgress: (state, action: PayloadAction<{ percentage: number; message: string }>) => {
      state.progress = action.payload;
    },
    setCurrentJob: (state, action: PayloadAction<AnalysisJob>) => {
      state.currentJob = action.payload;
    }
  },
  extraReducers: (builder) => {
    // Start Analysis
    builder
      .addCase(startAnalysis.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.progress = { percentage: 0, message: 'Starting analysis...' };
      })
      .addCase(startAnalysis.fulfilled, (state, action) => {
        state.isLoading = true; // Still loading as analysis is in progress
        state.currentJob = action.payload;
        state.error = null;
        state.progress = { percentage: 10, message: 'Analysis job created, waiting for scraper...' };
      })
      .addCase(startAnalysis.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as ApiError)?.error || 'Failed to start analysis';
        state.progress = { percentage: 0, message: '' };
      });

    // Check Status
    builder
      .addCase(checkAnalysisStatus.fulfilled, (state, action) => {
        state.currentJob = action.payload;
        state.progress = {
          percentage: action.payload.progress,
          message: getProgressMessage(action.payload.status, action.payload.progress)
        };
        
        // Handle failed jobs
        if (action.payload.status === 'failed') {
          state.isLoading = false;
          state.error = action.payload.errorMessage || 'Analysis failed';
        }
      })
      .addCase(checkAnalysisStatus.rejected, (state, action) => {
        state.error = (action.payload as ApiError)?.error || 'Failed to check status';
      });

    // Fetch Results
    builder
      .addCase(fetchAnalysisResults.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAnalysisResults.fulfilled, (state, action) => {
        state.isLoading = false;
        state.results = action.payload;
        state.progress = { percentage: 100, message: 'Analysis completed' };
      })
      .addCase(fetchAnalysisResults.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as ApiError)?.error || 'Failed to fetch results';
      });

    // Fetch Summary
    builder
      .addCase(fetchAnalysisSummary.fulfilled, (state, action) => {
        // Update results with summary data
        if (state.results) {
          state.results.statistics = action.payload.statistics;
        }
      });

    // Fetch Comments
    builder
      .addCase(fetchComments.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.results) {
          state.results.comments = action.payload.comments;
        }
      })
      .addCase(fetchComments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as ApiError)?.error || 'Failed to fetch comments';
      });
  }
});

// Helper function to get progress message
function getProgressMessage(status: string, progress: number): string {
  switch (status) {
    case 'pending':
      return 'Analysis queued...';
    case 'processing':
      if (progress < 20) return 'Scraping comments...';
      if (progress < 50) return 'Analyzing sentiment...';
      if (progress < 80) return 'Analyzing demographics...';
      if (progress < 95) return 'Processing results...';
      return 'Finalizing analysis...';
    case 'completed':
      return 'Analysis completed successfully!';
    case 'failed':
      return 'Analysis failed';
    default:
      return 'Processing...';
  }
}

export const { clearError, clearResults, updateProgress, setCurrentJob } = analysisSlice.actions;
export default analysisSlice.reducer;

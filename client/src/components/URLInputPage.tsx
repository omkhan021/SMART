'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { startAnalysis, clearError, clearResults } from '@/store/slices/analysisSlice';
import { setCurrentPage } from '@/store/slices/uiSlice';
import { PLATFORMS } from '@/types';
import { isValidURL, extractPlatformFromURL } from '@/utils/helpers';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export function URLInputPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error, progress } = useSelector((state: RootState) => state.analysis);
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [mockMode, setMockMode] = useState(false);

  // Clear any old error state and job data when component loads
  useEffect(() => {
    dispatch(clearError());
    dispatch(clearResults());
  }, [dispatch]);

  const handleUrlChange = (value: string) => {
    setUrl(value);
    setUrlError('');
    dispatch(clearError());
  };

  const validateUrl = (url: string): string | null => {
    if (!url.trim()) {
      return 'Please enter a URL';
    }

    if (!isValidURL(url)) {
      return 'Please enter a valid URL';
    }

    const platform = extractPlatformFromURL(url);
    if (!platform) {
      return 'Unsupported platform. Please use Instagram, Threads, Facebook, Twitter, Truth Social, or TikTok.';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateUrl(url);
    if (validationError) {
      setUrlError(validationError);
      return;
    }

    console.log('🚀 Starting analysis for URL:', url, 'Mock Mode:', mockMode);
    
    try {
      const result = await dispatch(startAnalysis({ url, mockMode }));
      console.log('📊 Analysis result:', result);
      console.log('📊 Analysis result payload:', result.payload);
      
      if (result.type.endsWith('/fulfilled')) {
        console.log('✅ Analysis started successfully:', result.payload);
        dispatch(setCurrentPage('results'));
        toast.success('Analysis started successfully!');
      } else if (result.type.endsWith('/rejected')) {
        console.error('❌ Analysis failed:', result.payload);
        const errorMessage = (result.payload as { error?: string })?.error || 'Failed to start analysis';
        toast.error(`Analysis failed: ${errorMessage}`);
      } else {
        console.error('❌ Unexpected result type:', result.type);
        toast.error('Unexpected error occurred');
      }
    } catch (error) {
      console.error('💥 Exception in handleSubmit:', error);
      toast.error('Failed to start analysis');
    }
  };

  const handleExampleClick = (exampleUrl: string) => {
    setUrl(exampleUrl);
    setUrlError('');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          SMART (Social Media Analysis and Reporting Tool)
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Analyze sentiments and demographics from social media post comments
        </p>
        
        {/* Supported Platforms */}
        <div className="mb-12">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 text-center">
            Supported Platforms
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {Object.values(PLATFORMS).map((platform) => (
              <div
                key={platform.name}
                className={`flex items-center space-x-2 px-4 py-3 rounded-xl ${platform.color} text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer`}
                title={`Click to see example ${platform.displayName} URL`}
                onClick={() => handleExampleClick(platform.exampleUrls[0])}
              >
                <span className="text-xl">{platform.icon}</span>
                <span className="font-semibold">{platform.displayName}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* URL Input Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="url" className="block text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 text-center">
              Enter Social Media Post URL
            </label>
            <div className="relative">
              <input
                type="url"
                id="url"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://www.instagram.com/p/ABC123DEF456/ or paste any social media post URL..."
                className={`w-full px-6 py-4 text-lg border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-300 ${
                  urlError ? 'border-red-500 focus:ring-red-500/20' : 'border-gray-300 hover:border-gray-400'
                }`}
                disabled={isLoading}
              />
              {url && !urlError && isValidURL(url) && (
                <CheckCircle className="absolute right-4 top-4 h-7 w-7 text-green-500" />
              )}
              {urlError && (
                <AlertCircle className="absolute right-4 top-4 h-7 w-7 text-red-500" />
              )}
            </div>
            {urlError && (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400 text-center">{urlError}</p>
            )}
            {error && (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
            )}
          </div>

          {/* Mock Mode Toggle */}
          <div className="flex items-center justify-center space-x-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <input
              type="checkbox"
              id="mockMode"
              checked={mockMode}
              onChange={(e) => setMockMode(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="mockMode" className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Demo Mode (Use Mock Data)
            </label>
          </div>
          <div className="text-center">
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-4">
              Enable demo mode to see how the analysis would work with sample data, bypassing platform restrictions.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-4 px-8 rounded-lg transition-all duration-300 flex items-center justify-center space-x-3 text-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span>Analyze Post</span>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Enhanced Progress Bar */}
        {isLoading && (
          <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Analysis in Progress
              </h3>
              <p className="text-blue-700 dark:text-blue-300">{progress.message}</p>
            </div>
            
            <div className="relative">
              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-3 mb-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {progress.percentage}% Complete
                </span>
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-sm text-blue-600 dark:text-blue-400">Processing...</span>
                </div>
              </div>
            </div>

            {/* Analysis Steps */}
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
              <div className={`text-center p-2 rounded ${progress.percentage >= 20 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                <div className="font-medium">Scraping</div>
                <div>Comments</div>
              </div>
              <div className={`text-center p-2 rounded ${progress.percentage >= 60 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                <div className="font-medium">Analyzing</div>
                <div>Sentiment</div>
              </div>
              <div className={`text-center p-2 rounded ${progress.percentage >= 90 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                <div className="font-medium">Demographics</div>
                <div>Analysis</div>
              </div>
            </div>
          </div>
        )}
      </div>


      {/* Features */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
          What We Analyze
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">😊</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Sentiment Analysis
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Positive, negative, and neutral sentiment detection with emotion analysis
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Demographics
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Age, gender, and location prediction from usernames and profiles
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Visualizations
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Interactive charts, maps, and detailed analytics dashboard
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

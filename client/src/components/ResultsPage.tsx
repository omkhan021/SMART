'use client';

import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { checkAnalysisStatus, fetchAnalysisResults, clearError } from '@/store/slices/analysisSlice';
import { setCurrentPage } from '@/store/slices/uiSlice';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { SentimentChart } from './charts/SentimentChart';
import { DemographicsChart } from './charts/DemographicsChart';
import { CommentList } from './charts/CommentList';

export function ResultsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { currentJob, results, error, progress } = useSelector((state: RootState) => state.analysis);

  useEffect(() => {
    console.log('🔄 ResultsPage: currentJob changed:', currentJob);
    if (currentJob && currentJob.status !== 'completed' && currentJob.status !== 'failed') {
      console.log('🔄 ResultsPage: Starting status check interval for job:', currentJob.id);
      const interval = setInterval(() => {
        console.log('🔄 ResultsPage: Checking status for job ID:', currentJob.id);
        dispatch(checkAnalysisStatus(currentJob.id));
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [currentJob, dispatch]);

  useEffect(() => {
    if (currentJob?.status === 'completed' && !results) {
      dispatch(fetchAnalysisResults(currentJob.id));
    }
  }, [currentJob, results, dispatch]);

  // Auto-redirect to results when analysis is complete
  useEffect(() => {
    if (currentJob?.status === 'completed' && results) {
      // Analysis is complete and results are loaded
      toast.success('Analysis completed successfully!');
    }
  }, [currentJob?.status, results]);

  const handleRetry = () => {
    dispatch(clearError());
    if (currentJob) {
      dispatch(checkAnalysisStatus(currentJob.id));
    }
  };

  const handleNewAnalysis = () => {
    dispatch(setCurrentPage('input'));
  };

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Analysis Failed
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
        <div className="flex space-x-4 justify-center">
          <button
            onClick={handleRetry}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Retry</span>
          </button>
          <button
            onClick={handleNewAnalysis}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg"
          >
            New Analysis
          </button>
        </div>
      </div>
    );
  }

  if (!currentJob) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          No Analysis Found
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Please start a new analysis to view results.
        </p>
        <button
          onClick={handleNewAnalysis}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
        >
          Start New Analysis
        </button>
      </div>
    );
  }

  if (currentJob.status === 'failed') {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Analysis Failed
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {currentJob.errorMessage || 'The analysis could not be completed. This might be due to platform restrictions or network issues.'}
        </p>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            Demo Limitations
          </h3>
          <p className="text-yellow-700 dark:text-yellow-300 text-sm">
            This is a demo application. Social media platforms often block automated access. 
            In a production environment, you would need proper authentication and API access.
          </p>
        </div>
        <div className="flex space-x-4 justify-center">
          <button
            onClick={handleRetry}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </button>
          <button
            onClick={handleNewAnalysis}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg"
          >
            New Analysis
          </button>
        </div>
      </div>
    );
  }

  if (currentJob.status === 'pending' || currentJob.status === 'processing') {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <Loader2 className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-spin" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Analyzing Your Post
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{progress.message}</p>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-6">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {currentJob.processedComments} of {currentJob.totalComments} comments processed
        </div>
      </div>
    );
  }

  if (currentJob.status === 'completed' && results) {
    return (
      <div className="max-w-7xl mx-auto">
        {/* Header with Summary Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Analysis Complete! 📊
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {results.post.platform.toUpperCase()} Post Analysis Results
              </p>
            </div>
            <button
              onClick={handleNewAnalysis}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Analyze Another Post
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Total Comments
              </h3>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {results.post.total_comments.toLocaleString()}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                Positive Sentiment
              </h3>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {results.statistics.sentiment.sentimentPercentages.positive.toFixed(1)}%
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                Negative Sentiment
              </h3>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {results.statistics.sentiment.sentimentPercentages.negative.toFixed(1)}%
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-2">
                Avg Confidence
              </h3>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {(results.statistics.sentiment.averageConfidence * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Sentiment Analysis Charts */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Sentiment Analysis
          </h2>
          <SentimentChart data={results.statistics.sentiment} />
        </div>

        {/* Demographics Charts */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Demographics Analysis
          </h2>
          <DemographicsChart data={results.statistics.demographics} />
        </div>

        {/* Comments List */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Comments Breakdown
          </h2>
          <CommentList comments={results.comments.data} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto text-center py-12">
      <Loader2 className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-spin" />
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Loading Results...
      </h2>
      <p className="text-gray-600 dark:text-gray-400">
        Please wait while we fetch your analysis results.
      </p>
    </div>
  );
}

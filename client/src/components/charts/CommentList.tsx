import React, { useState } from 'react';
import { Comment } from '../../types';
import { getSentimentColor, getEmotionColor } from '../../utils/helpers';

interface CommentListProps {
  comments: Comment[];
}

export function CommentList({ comments }: CommentListProps) {
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative' | 'neutral'>('all');
  const [sortBy, setSortBy] = useState<'timestamp' | 'likes' | 'sentiment'>('timestamp');

  const filteredComments = comments.filter(comment => {
    if (filter === 'all') return true;
    return comment.sentiment_primary === filter;
  });

  const sortedComments = [...filteredComments].sort((a, b) => {
    switch (sortBy) {
      case 'likes':
        return b.likes_count - a.likes_count;
      case 'sentiment':
        const sentimentOrder = { positive: 3, neutral: 2, negative: 1 };
        return sentimentOrder[b.sentiment_primary] - sentimentOrder[a.sentiment_primary];
      case 'timestamp':
      default:
        return new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime();
    }
  });

  const formatDate = (timestamp?: string) => {
    if (!timestamp) return 'Unknown date';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😞';
      case 'neutral': return '😐';
      default: return '❓';
    }
  };

  const getEmotionIcon = (emotion: string) => {
    switch (emotion) {
      case 'joy': return '😄';
      case 'anger': return '😠';
      case 'sadness': return '😢';
      case 'fear': return '😨';
      case 'surprise': return '😲';
      case 'disgust': return '🤢';
      default: return '😐';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          Comments Analysis ({filteredComments.length} of {comments.length})
        </h3>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Sentiments</option>
            <option value="positive">Positive</option>
            <option value="negative">Negative</option>
            <option value="neutral">Neutral</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="timestamp">Sort by Date</option>
            <option value="likes">Sort by Likes</option>
            <option value="sentiment">Sort by Sentiment</option>
          </select>
        </div>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {sortedComments.map((comment) => (
          <div
            key={comment.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {comment.username}
                </span>
                {comment.demographics && (
                  <span className="text-xs text-gray-500">
                    {comment.demographics.predicted_age && `${comment.demographics.predicted_age}y`}
                    {comment.demographics.predicted_gender && `, ${comment.demographics.predicted_gender}`}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {formatDate(comment.timestamp)}
                </span>
              </div>
            </div>

            <p className="text-gray-700 dark:text-gray-300 mb-3">
              {comment.comment_text}
            </p>

            <div className="flex flex-wrap items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Sentiment */}
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(comment.sentiment_primary)}`}>
                  <span className="mr-1">{getSentimentIcon(comment.sentiment_primary)}</span>
                  {comment.sentiment_primary}
                </span>

                {/* Emotion */}
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEmotionColor(comment.sentiment_emotion)}`}>
                  <span className="mr-1">{getEmotionIcon(comment.sentiment_emotion)}</span>
                  {comment.sentiment_emotion}
                </span>

                {/* Confidence */}
                <span className="text-xs text-gray-500">
                  {(comment.confidence_score * 100).toFixed(0)}% confidence
                </span>
              </div>

              <div className="flex items-center space-x-3 text-sm text-gray-500">
                <span className="flex items-center">
                  <span className="mr-1">👍</span>
                  {comment.likes_count}
                </span>
                <span className="flex items-center">
                  <span className="mr-1">💬</span>
                  {comment.reply_count}
                </span>
              </div>
            </div>

            {/* Reasoning */}
            {comment.reasoning && (
              <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400">
                <strong>Analysis:</strong> {comment.reasoning}
              </div>
            )}
          </div>
        ))}
      </div>

      {sortedComments.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No comments found for the selected filter.
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { SentimentStatistics } from '../../types';

interface SentimentChartProps {
  data: SentimentStatistics;
}

const COLORS = {
  positive: '#10B981', // green-500
  negative: '#EF4444', // red-500
  neutral: '#6B7280',  // gray-500
};

const EMOTION_COLORS = {
  joy: '#10B981',      // green-500
  anger: '#EF4444',    // red-500
  sadness: '#3B82F6',  // blue-500
  fear: '#8B5CF6',     // violet-500
  surprise: '#F59E0B', // amber-500
  disgust: '#EC4899',  // pink-500
};

export function SentimentChart({ data }: SentimentChartProps) {
  // Prepare data for pie chart
  const sentimentData = [
    { name: 'Positive', value: data.sentiment.positive, percentage: data.sentimentPercentages.positive },
    { name: 'Negative', value: data.sentiment.negative, percentage: data.sentimentPercentages.negative },
    { name: 'Neutral', value: data.sentiment.neutral, percentage: data.sentimentPercentages.neutral },
  ].filter(item => item.value > 0);

  // Prepare data for emotion bar chart
  const emotionData = [
    { emotion: 'Joy', count: data.emotion.joy, percentage: data.emotionPercentages.joy },
    { emotion: 'Anger', count: data.emotion.anger, percentage: data.emotionPercentages.anger },
    { emotion: 'Sadness', count: data.emotion.sadness, percentage: data.emotionPercentages.sadness },
    { emotion: 'Fear', count: data.emotion.fear, percentage: data.emotionPercentages.fear },
    { emotion: 'Surprise', count: data.emotion.surprise, percentage: data.emotionPercentages.surprise },
    { emotion: 'Disgust', count: data.emotion.disgust, percentage: data.emotionPercentages.disgust },
  ].filter(item => item.count > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-semibold">{payload[0].name}</p>
          <p className="text-sm">
            Count: {payload[0].value}
            {payload[0].payload.percentage && (
              <span className="ml-2 text-gray-500">
                ({payload[0].payload.percentage.toFixed(1)}%)
              </span>
            )}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Sentiment Distribution Pie Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Sentiment Distribution
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sentimentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {sentimentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          {sentimentData.map((item) => (
            <div key={item.name} className="text-center">
              <div 
                className="w-4 h-4 mx-auto mb-1 rounded-full"
                style={{ backgroundColor: COLORS[item.name.toLowerCase() as keyof typeof COLORS] }}
              />
              <p className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
              <p className="text-lg font-bold" style={{ color: COLORS[item.name.toLowerCase() as keyof typeof COLORS] }}>
                {item.value}
              </p>
              <p className="text-xs text-gray-500">{item.percentage.toFixed(1)}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Emotion Analysis Bar Chart */}
      {emotionData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Emotion Analysis
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={emotionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="emotion" 
                  stroke="#6B7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6B7280"
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {emotionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={EMOTION_COLORS[entry.emotion.toLowerCase() as keyof typeof EMOTION_COLORS]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Confidence Score */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Analysis Confidence
        </h3>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${data.averageConfidence * 100}%` }}
              />
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {(data.averageConfidence * 100).toFixed(1)}%
            </p>
            <p className="text-sm text-gray-500">Average Confidence</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// API Response Types
export interface AnalysisJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  totalComments: number;
  processedComments: number;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface Post {
  id: string;
  platform: 'instagram' | 'threads' | 'facebook' | 'twitter' | 'truth_social' | 'tiktok';
  original_url: string;
  post_author?: string;
  post_content?: string;
  total_comments: number;
  analysis_timestamp: string;
}

export interface Comment {
  id: string;
  username: string;
  comment_text: string;
  timestamp?: string;
  likes_count: number;
  reply_count: number;
  sentiment_primary: 'positive' | 'negative' | 'neutral';
  sentiment_abuse: 'safe' | 'profanity' | 'toxic' | 'hate_speech' | 'harassment';
  sentiment_emotion: 'joy' | 'anger' | 'sadness' | 'fear' | 'surprise' | 'disgust';
  confidence_score: number;
  reasoning: string;
  demographics?: Demographics;
}

export interface Demographics {
  predicted_age?: number;
  age_confidence?: number;
  predicted_gender?: 'male' | 'female' | 'non-binary' | 'unknown';
  gender_confidence?: number;
  predicted_location_country?: string;
  predicted_location_state?: string;
  predicted_location_city?: string;
  location_confidence?: number;
}

export interface SentimentStatistics {
  total: number;
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
  abuse: {
    safe: number;
    profanity: number;
    toxic: number;
    hate_speech: number;
    harassment: number;
  };
  emotion: {
    joy: number;
    anger: number;
    sadness: number;
    fear: number;
    surprise: number;
    disgust: number;
  };
  averageConfidence: number;
  sentimentPercentages: {
    positive: number;
    negative: number;
    neutral: number;
  };
  abusePercentages: {
    safe: number;
    profanity: number;
    toxic: number;
    hate_speech: number;
    harassment: number;
  };
  emotionPercentages: {
    joy: number;
    anger: number;
    sadness: number;
    fear: number;
    surprise: number;
    disgust: number;
  };
}

export interface DemographicStatistics {
  total: number;
  age: {
    distribution: {
      '13-17': number;
      '18-24': number;
      '25-34': number;
      '35-44': number;
      '45-54': number;
      '55+': number;
      unknown: number;
    };
    average: number;
    median: number;
  };
  gender: {
    male: number;
    female: number;
    'non-binary': number;
    unknown: number;
  };
  location: {
    countries: Record<string, number>;
    states: Record<string, number>;
    cities: Record<string, number>;
  };
  agePercentages: Record<string, number>;
  genderPercentages: Record<string, number>;
}

export interface AnalysisResults {
  job: AnalysisJob;
  post: Post;
  comments: {
    data: Comment[];
    pagination: {
      current_page: number;
      per_page: number;
      total: number;
      total_pages: number;
    };
  };
  statistics: {
    sentiment: SentimentStatistics;
    demographics: DemographicStatistics;
  };
}

// UI State Types
export interface AnalysisState {
  currentJob: AnalysisJob | null;
  results: AnalysisResults | null;
  isLoading: boolean;
  error: string | null;
  progress: {
    percentage: number;
    message: string;
  };
}

export interface FilterState {
  sentiment: string[];
  emotion: string[];
  abuseLevel: string[];
  gender: string[];
  ageRange: {
    min: number;
    max: number;
  };
  searchQuery: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// Platform Types
export interface PlatformInfo {
  name: string;
  displayName: string;
  icon: string;
  color: string;
  exampleUrls: string[];
}

export const PLATFORMS: Record<string, PlatformInfo> = {
  instagram: {
    name: 'instagram',
    displayName: 'Instagram',
    icon: '📷',
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    exampleUrls: [
      'https://www.instagram.com/p/ABC123DEF456/',
      'https://www.instagram.com/reel/XYZ789GHI012/'
    ]
  },
  threads: {
    name: 'threads',
    displayName: 'Threads',
    icon: '🧵',
    color: 'bg-gradient-to-r from-blue-500 to-purple-500',
    exampleUrls: [
      'https://www.threads.net/@username/post/ABC123DEF456'
    ]
  },
  facebook: {
    name: 'facebook',
    displayName: 'Facebook',
    icon: '📘',
    color: 'bg-blue-600',
    exampleUrls: [
      'https://www.facebook.com/username/posts/1234567890',
      'https://www.facebook.com/groups/groupname/permalink/1234567890'
    ]
  },
  twitter: {
    name: 'twitter',
    displayName: 'X (Twitter)',
    icon: '🐦',
    color: 'bg-black',
    exampleUrls: [
      'https://twitter.com/username/status/1234567890',
      'https://x.com/username/status/1234567890'
    ]
  },
  truth_social: {
    name: 'truth_social',
    displayName: 'Truth Social',
    icon: '🦅',
    color: 'bg-red-600',
    exampleUrls: [
      'https://truthsocial.com/@username/posts/1234567890'
    ]
  },
  tiktok: {
    name: 'tiktok',
    displayName: 'TikTok',
    icon: '🎵',
    color: 'bg-black',
    exampleUrls: [
      'https://www.tiktok.com/@username/video/1234567890'
    ]
  }
};

// Chart Data Types
export interface ChartData {
  name: string;
  value: number;
  percentage?: number;
  color?: string;
}

export interface TimeSeriesData {
  timestamp: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  count: number;
}

// Export Types
export type ExportFormat = 'csv' | 'excel' | 'json' | 'pdf';

// API Error Types
export interface ApiError {
  error: string;
  message?: string;
  details?: unknown[];
}

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility function to merge Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format numbers with commas
export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

// Format percentages
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// Format dates
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Format relative time
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return formatDate(date);
}

// Truncate text
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Get sentiment color
export function getSentimentColor(sentiment: string): string {
  switch (sentiment) {
    case 'positive':
      return 'text-green-600 bg-green-100';
    case 'negative':
      return 'text-red-600 bg-red-100';
    case 'neutral':
      return 'text-gray-600 bg-gray-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

// Get emotion color
export function getEmotionColor(emotion: string): string {
  switch (emotion) {
    case 'joy':
      return 'text-yellow-600 bg-yellow-100';
    case 'anger':
      return 'text-red-600 bg-red-100';
    case 'sadness':
      return 'text-blue-600 bg-blue-100';
    case 'fear':
      return 'text-purple-600 bg-purple-100';
    case 'surprise':
      return 'text-orange-600 bg-orange-100';
    case 'disgust':
      return 'text-green-600 bg-green-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

// Get abuse level color
export function getAbuseLevelColor(abuseLevel: string): string {
  switch (abuseLevel) {
    case 'safe':
      return 'text-green-600 bg-green-100';
    case 'profanity':
      return 'text-yellow-600 bg-yellow-100';
    case 'toxic':
      return 'text-orange-600 bg-orange-100';
    case 'hate_speech':
      return 'text-red-600 bg-red-100';
    case 'harassment':
      return 'text-red-700 bg-red-200';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

// Get gender color
export function getGenderColor(gender: string): string {
  switch (gender) {
    case 'male':
      return 'text-blue-600 bg-blue-100';
    case 'female':
      return 'text-pink-600 bg-pink-100';
    case 'non-binary':
      return 'text-purple-600 bg-purple-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

// Validate URL
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Extract platform from URL
export function extractPlatformFromURL(url: string): string | null {
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('threads.net')) return 'threads';
  if (url.includes('facebook.com')) return 'facebook';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
  if (url.includes('truthsocial.com')) return 'truth_social';
  if (url.includes('tiktok.com')) return 'tiktok';
  return null;
}

// Generate random ID
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Download file
export function downloadFile(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// Copy to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  }
}

// Get confidence level text
export function getConfidenceLevel(score: number): string {
  if (score >= 0.8) return 'High';
  if (score >= 0.6) return 'Medium';
  if (score >= 0.4) return 'Low';
  return 'Very Low';
}

// Get confidence color
export function getConfidenceColor(score: number): string {
  if (score >= 0.8) return 'text-green-600 bg-green-100';
  if (score >= 0.6) return 'text-yellow-600 bg-yellow-100';
  if (score >= 0.4) return 'text-orange-600 bg-orange-100';
  return 'text-red-600 bg-red-100';
}

const { URL } = require('url');

class URLParser {
  constructor() {
    this.platforms = {
      instagram: {
        patterns: [
          /^https?:\/\/(www\.)?instagram\.com\/p\/([^\/\?]+)/,
          /^https?:\/\/(www\.)?instagram\.com\/reel\/([^\/\?]+)/,
          /^https?:\/\/(www\.)?instagram\.com\/tv\/([^\/\?]+)/
        ],
        extractId: (match) => match[2]
      },
      threads: {
        patterns: [
          /^https?:\/\/(www\.)?threads\.net\/@([^\/]+)\/post\/([^\/\?]+)/
        ],
        extractId: (match) => match[3]
      },
      facebook: {
        patterns: [
          /^https?:\/\/(www\.)?facebook\.com\/([^\/]+)\/posts\/([^\/\?]+)/,
          /^https?:\/\/(www\.)?facebook\.com\/([^\/]+)\/photos\/([^\/\?]+)/,
          /^https?:\/\/(www\.)?facebook\.com\/groups\/([^\/]+)\/permalink\/([^\/\?]+)/
        ],
        extractId: (match) => match[3] || match[2]
      },
      twitter: {
        patterns: [
          /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/([^\/]+)\/status\/([^\/\?]+)/
        ],
        extractId: (match) => match[4]
      },
      truth_social: {
        patterns: [
          /^https?:\/\/(www\.)?truthsocial\.com\/@([^\/]+)\/posts\/([^\/\?]+)/
        ],
        extractId: (match) => match[3]
      },
      tiktok: {
        patterns: [
          /^https?:\/\/(www\.)?tiktok\.com\/@([^\/]+)\/video\/([^\/\?]+)/
        ],
        extractId: (match) => match[3]
      }
    };
  }

  /**
   * Parse a social media URL and extract platform and post ID
   * @param {string} url - The social media post URL
   * @returns {Object} - { platform, postId, username, isValid }
   */
  parseURL(url) {
    try {
      // Validate URL format
      new URL(url);
      
      // Normalize URL (remove trailing slash, convert to lowercase)
      const normalizedUrl = url.toLowerCase().replace(/\/$/, '');
      
      // Check each platform
      for (const [platform, config] of Object.entries(this.platforms)) {
        for (const pattern of config.patterns) {
          const match = normalizedUrl.match(pattern);
          if (match) {
            const postId = config.extractId(match);
            const username = this.extractUsername(match, platform);
            
            return {
              platform,
              postId,
              username,
              isValid: true,
              originalUrl: url
            };
          }
        }
      }
      
      return {
        platform: null,
        postId: null,
        username: null,
        isValid: false,
        error: 'Unsupported platform or invalid URL format'
      };
    } catch (error) {
      return {
        platform: null,
        postId: null,
        username: null,
        isValid: false,
        error: 'Invalid URL format'
      };
    }
  }

  /**
   * Extract username from URL match
   * @param {Array} match - Regex match result
   * @param {string} platform - Platform name
   * @returns {string|null} - Username or null
   */
  extractUsername(match, platform) {
    switch (platform) {
      case 'instagram':
        return null; // Instagram doesn't include username in post URLs
      case 'threads':
        return match[2] || null;
      case 'facebook':
        return match[2] || null;
      case 'twitter':
        return match[3] || null;
      case 'truth_social':
        return match[2] || null;
      case 'tiktok':
        return match[2] || null;
      default:
        return null;
    }
  }

  /**
   * Validate if a URL is from a supported platform
   * @param {string} url - The URL to validate
   * @returns {boolean} - True if supported
   */
  isSupportedPlatform(url) {
    const result = this.parseURL(url);
    return result.isValid;
  }

  /**
   * Get list of supported platforms
   * @returns {Array} - Array of platform names
   */
  getSupportedPlatforms() {
    return Object.keys(this.platforms);
  }

  /**
   * Get example URLs for each platform
   * @returns {Object} - Object with platform names as keys and example URLs as values
   */
  getExampleURLs() {
    return {
      instagram: [
        'https://www.instagram.com/p/ABC123DEF456/',
        'https://www.instagram.com/reel/XYZ789GHI012/'
      ],
      threads: [
        'https://www.threads.net/@username/post/ABC123DEF456'
      ],
      facebook: [
        'https://www.facebook.com/username/posts/1234567890',
        'https://www.facebook.com/groups/groupname/permalink/1234567890'
      ],
      twitter: [
        'https://twitter.com/username/status/1234567890',
        'https://x.com/username/status/1234567890'
      ],
      truth_social: [
        'https://truthsocial.com/@username/posts/1234567890'
      ],
      tiktok: [
        'https://www.tiktok.com/@username/video/1234567890'
      ]
    };
  }
}

module.exports = URLParser;

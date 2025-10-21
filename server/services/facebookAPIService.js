const { exec } = require('child_process');
const { promisify } = require('util');
const config = require('../config');

const execAsync = promisify(exec);

class FacebookAPIService {
  constructor() {
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    ];
  }

  /**
   * Get random user agent
   */
  getRandomUserAgent() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  /**
   * Extract post ID from Facebook URL
   */
  extractPostId(url) {
    const patterns = [
      /facebook\.com\/([^\/]+)\/posts\/([^\/\?]+)/,
      /facebook\.com\/([^\/]+)\/photos\/([^\/\?]+)/,
      /facebook\.com\/groups\/([^\/]+)\/permalink\/([^\/\?]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[2] || match[1];
      }
    }

    return null;
  }

  /**
   * Fetch Facebook post using curl
   */
  async fetchPostWithCurl(url, progressCallback = null) {
    try {
      if (progressCallback) {
        progressCallback(20, 'Fetching Facebook post with curl...');
      }

      const userAgent = this.getRandomUserAgent();
      const command = `curl -s -L -H "User-Agent: ${userAgent}" -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8" -H "Accept-Language: en-US,en;q=0.5" -H "Accept-Encoding: gzip, deflate" -H "Connection: keep-alive" -H "Upgrade-Insecure-Requests: 1" "${url}"`;

      console.log(`📘 Fetching Facebook post: ${url}`);
      const { stdout, stderr } = await execAsync(command);

      if (stderr) {
        console.warn('⚠️ Curl stderr:', stderr);
      }

      if (!stdout || stdout.trim().length === 0) {
        throw new Error('Empty response from Facebook');
      }

      console.log(`✅ Facebook post fetched successfully (${stdout.length} characters)`);
      return stdout;

    } catch (error) {
      console.error('❌ Error fetching Facebook post with curl:', error.message);
      throw new Error(`Failed to fetch Facebook post: ${error.message}`);
    }
  }

  /**
   * Parse Facebook HTML content to extract post data and comments
   */
  parseFacebookContent(html, progressCallback = null) {
    try {
      if (progressCallback) {
        progressCallback(40, 'Parsing Facebook content...');
      }

      // Facebook content parsing is complex due to their dynamic loading
      // This is a simplified version that looks for basic post information
      
      // Extract post author
      const authorMatch = html.match(/"name":"([^"]+)"/);
      const author = authorMatch ? authorMatch[1] : 'unknown';

      // Extract post content (simplified)
      const contentMatch = html.match(/"message":"([^"]+)"/);
      const content = contentMatch ? contentMatch[1] : '';

      if (progressCallback) {
        progressCallback(60, 'Extracting post information...');
      }

      // Extract basic post information
      const postData = {
        id: 'facebook_' + Date.now(),
        author: {
          username: author,
          full_name: author
        },
        content: content,
        created_at: new Date().toISOString(),
        likes_count: 0,
        comments_count: 0,
        media_type: 'GraphPost'
      };

      if (progressCallback) {
        progressCallback(80, 'Extracting comments...');
      }

      // Facebook comments are heavily protected and require authentication
      // For now, return empty comments array
      const comments = [];

      if (progressCallback) {
        progressCallback(100, 'Facebook parsing completed!');
      }

      console.log(`✅ Facebook parsing completed: ${comments.length} comments found`);

      return {
        platform: 'facebook',
        postData,
        comments: comments,
        totalComments: comments.length
      };

    } catch (error) {
      console.error('❌ Error parsing Facebook content:', error.message);
      throw new Error(`Failed to parse Facebook content: ${error.message}`);
    }
  }

  /**
   * Scrape Facebook post and its comments
   */
  async scrapeFacebookPost(url, progressCallback = null) {
    try {
      console.log(`🚀 Starting Facebook scraping for: ${url}`);
      
      if (progressCallback) {
        progressCallback(10, 'Extracting post ID from URL...');
      }

      // Extract post ID from URL
      const postId = this.extractPostId(url);
      if (!postId) {
        throw new Error('Invalid Facebook URL - could not extract post ID');
      }

      console.log(`📝 Post ID: ${postId}`);

      // Fetch the post content using curl
      const html = await this.fetchPostWithCurl(url, progressCallback);

      // Parse the HTML content
      const result = await this.parseFacebookContent(html, progressCallback);

      console.log(`✅ Facebook scraping completed: ${result.comments.length} comments found`);
      return result;

    } catch (error) {
      console.error('❌ Facebook scraping failed:', error.message);
      throw new Error(`Facebook scraping failed: ${error.message}`);
    }
  }

  /**
   * Check if the service is available
   */
  isConfigured() {
    return true; // Curl-based service doesn't need API keys
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      configured: this.isConfigured(),
      method: 'curl',
      userAgents: this.userAgents.length,
      note: 'Facebook comments require authentication and are heavily protected'
    };
  }
}

module.exports = FacebookAPIService;

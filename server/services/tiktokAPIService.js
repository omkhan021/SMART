const { exec } = require('child_process');
const { promisify } = require('util');
const config = require('../config');

const execAsync = promisify(exec);

class TikTokAPIService {
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
   * Extract video ID from TikTok URL
   */
  extractVideoId(url) {
    const patterns = [
      /tiktok\.com\/@([^\/]+)\/video\/([^\/\?]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[2];
      }
    }

    return null;
  }

  /**
   * Fetch TikTok video using curl
   */
  async fetchVideoWithCurl(url, progressCallback = null) {
    try {
      if (progressCallback) {
        progressCallback(20, 'Fetching TikTok video with curl...');
      }

      const userAgent = this.getRandomUserAgent();
      const command = `curl -s -L -H "User-Agent: ${userAgent}" -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8" -H "Accept-Language: en-US,en;q=0.5" -H "Accept-Encoding: gzip, deflate" -H "Connection: keep-alive" -H "Upgrade-Insecure-Requests: 1" "${url}"`;

      console.log(`🎵 Fetching TikTok video: ${url}`);
      const { stdout, stderr } = await execAsync(command);

      if (stderr) {
        console.warn('⚠️ Curl stderr:', stderr);
      }

      if (!stdout || stdout.trim().length === 0) {
        throw new Error('Empty response from TikTok');
      }

      console.log(`✅ TikTok video fetched successfully (${stdout.length} characters)`);
      return stdout;

    } catch (error) {
      console.error('❌ Error fetching TikTok video with curl:', error.message);
      throw new Error(`Failed to fetch TikTok video: ${error.message}`);
    }
  }

  /**
   * Parse TikTok HTML content to extract video data and comments
   */
  parseTikTokContent(html, progressCallback = null) {
    try {
      if (progressCallback) {
        progressCallback(40, 'Parsing TikTok content...');
      }

      // Extract JSON data from script tags
      const scriptRegex = /<script id="SIGI_STATE"[^>]*>(.+?)<\/script>/;
      const match = html.match(scriptRegex);
      
      if (!match) {
        throw new Error('Could not find TikTok data in HTML');
      }

      let data;
      try {
        data = JSON.parse(match[1]);
      } catch (parseError) {
        throw new Error('Could not parse TikTok JSON data');
      }

      // Navigate to video data
      const videoData = data.ItemModule;
      if (!videoData) {
        throw new Error('Could not find video data in TikTok response');
      }

      if (progressCallback) {
        progressCallback(60, 'Extracting video information...');
      }

      // Get the first video (assuming single video page)
      const videoId = Object.keys(videoData)[0];
      const video = videoData[videoId];
      
      if (!video) {
        throw new Error('Could not find video information');
      }

      // Extract video information
      const postData = {
        id: video.id,
        author: {
          username: video.author || 'unknown',
          nickname: video.nickname || 'Unknown',
          avatar: video.avatarLarger || null,
          verified: video.verified || false
        },
        content: video.desc || '',
        created_at: new Date(video.createTime * 1000).toISOString(),
        likes_count: video.stats?.diggCount || 0,
        comments_count: video.stats?.commentCount || 0,
        shares_count: video.stats?.shareCount || 0,
        views_count: video.stats?.playCount || 0,
        media_type: 'TikTokVideo',
        is_video: true,
        duration: video.video?.duration || 0
      };

      if (progressCallback) {
        progressCallback(80, 'Extracting comments...');
      }

      // TikTok comments are heavily protected and require authentication
      // For now, return empty comments array
      const comments = [];

      if (progressCallback) {
        progressCallback(100, 'TikTok parsing completed!');
      }

      console.log(`✅ TikTok parsing completed: ${comments.length} comments found`);

      return {
        platform: 'tiktok',
        postData,
        comments: comments,
        totalComments: comments.length
      };

    } catch (error) {
      console.error('❌ Error parsing TikTok content:', error.message);
      throw new Error(`Failed to parse TikTok content: ${error.message}`);
    }
  }

  /**
   * Scrape TikTok video and its comments
   */
  async scrapeTikTokVideo(url, progressCallback = null) {
    try {
      console.log(`🚀 Starting TikTok scraping for: ${url}`);
      
      if (progressCallback) {
        progressCallback(10, 'Extracting video ID from URL...');
      }

      // Extract video ID from URL
      const videoId = this.extractVideoId(url);
      if (!videoId) {
        throw new Error('Invalid TikTok URL - could not extract video ID');
      }

      console.log(`📝 Video ID: ${videoId}`);

      // Fetch the video content using curl
      const html = await this.fetchVideoWithCurl(url, progressCallback);

      // Parse the HTML content
      const result = await this.parseTikTokContent(html, progressCallback);

      console.log(`✅ TikTok scraping completed: ${result.comments.length} comments found`);
      return result;

    } catch (error) {
      console.error('❌ TikTok scraping failed:', error.message);
      throw new Error(`TikTok scraping failed: ${error.message}`);
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
      note: 'TikTok comments require authentication and are heavily protected'
    };
  }
}

module.exports = TikTokAPIService;

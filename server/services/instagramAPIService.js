const { exec } = require('child_process');
const { promisify } = require('util');
const config = require('../config');

const execAsync = promisify(exec);

class InstagramAPIService {
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
   * Extract post ID from Instagram URL
   */
  extractPostId(url) {
    const patterns = [
      /instagram\.com\/p\/([^\/\?]+)/,
      /instagram\.com\/reel\/([^\/\?]+)/,
      /instagram\.com\/tv\/([^\/\?]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Fetch Instagram post using curl
   */
  async fetchPostWithCurl(url, progressCallback = null) {
    try {
      if (progressCallback) {
        progressCallback(20, 'Fetching Instagram post with curl...');
      }

      const userAgent = this.getRandomUserAgent();
      const command = `curl -s -L -H "User-Agent: ${userAgent}" -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8" -H "Accept-Language: en-US,en;q=0.5" -H "Accept-Encoding: gzip, deflate" -H "Connection: keep-alive" -H "Upgrade-Insecure-Requests: 1" "${url}"`;

      console.log(`📱 Fetching Instagram post: ${url}`);
      const { stdout, stderr } = await execAsync(command);

      if (stderr) {
        console.warn('⚠️ Curl stderr:', stderr);
      }

      if (!stdout || stdout.trim().length === 0) {
        throw new Error('Empty response from Instagram');
      }

      console.log(`✅ Instagram post fetched successfully (${stdout.length} characters)`);
      return stdout;

    } catch (error) {
      console.error('❌ Error fetching Instagram post with curl:', error.message);
      throw new Error(`Failed to fetch Instagram post: ${error.message}`);
    }
  }

  /**
   * Parse Instagram HTML content to extract post data and comments
   */
  parseInstagramContent(html, progressCallback = null) {
    try {
      if (progressCallback) {
        progressCallback(40, 'Parsing Instagram content...');
      }

      // Extract JSON data from script tags
      const scriptRegex = /window\._sharedData\s*=\s*({.+?});/;
      const match = html.match(scriptRegex);
      
      if (!match) {
        throw new Error('Could not find Instagram data in HTML');
      }

      let data;
      try {
        data = JSON.parse(match[1]);
      } catch (parseError) {
        throw new Error('Could not parse Instagram JSON data');
      }

      // Navigate to post data
      const entryData = data.entry_data?.PostPage?.[0]?.graphql?.shortcode_media;
      if (!entryData) {
        throw new Error('Could not find post data in Instagram response');
      }

      if (progressCallback) {
        progressCallback(60, 'Extracting post information...');
      }

      // Extract post information
      const postData = {
        id: entryData.id,
        shortcode: entryData.shortcode,
        author: {
          username: entryData.owner?.username || 'unknown',
          full_name: entryData.owner?.full_name || 'Unknown',
          profile_pic_url: entryData.owner?.profile_pic_url || null,
          is_verified: entryData.owner?.is_verified || false,
          is_private: entryData.owner?.is_private || false
        },
        content: entryData.edge_media_to_caption?.edges?.[0]?.node?.text || '',
        created_at: new Date(entryData.taken_at_timestamp * 1000).toISOString(),
        likes_count: entryData.edge_media_preview_like?.count || 0,
        comments_count: entryData.edge_media_to_comment?.count || 0,
        media_type: entryData.__typename || 'GraphImage',
        is_video: entryData.is_video || false,
        video_view_count: entryData.video_view_count || 0
      };

      if (progressCallback) {
        progressCallback(80, 'Extracting comments...');
      }

      // Extract comments
      const comments = [];
      const commentEdges = entryData.edge_media_to_comment?.edges || [];
      
      commentEdges.forEach((edge, index) => {
        const comment = edge.node;
        if (comment && comment.text) {
          comments.push({
            id: comment.id,
            username: comment.owner?.username || 'unknown',
            text: comment.text,
            timestamp: new Date(comment.created_at * 1000).toISOString(),
            likes_count: comment.edge_liked_by?.count || 0,
            reply_count: 0 // Instagram doesn't provide reply counts in this API
          });
        }
      });

      if (progressCallback) {
        progressCallback(100, 'Instagram parsing completed!');
      }

      console.log(`✅ Instagram parsing completed: ${comments.length} comments found`);

      return {
        platform: 'instagram',
        postData,
        comments: comments.slice(0, 1000), // Limit to prevent memory issues
        totalComments: comments.length
      };

    } catch (error) {
      console.error('❌ Error parsing Instagram content:', error.message);
      throw new Error(`Failed to parse Instagram content: ${error.message}`);
    }
  }

  /**
   * Scrape Instagram post and its comments
   */
  async scrapeInstagramPost(url, progressCallback = null) {
    try {
      console.log(`🚀 Starting Instagram scraping for: ${url}`);
      
      if (progressCallback) {
        progressCallback(10, 'Extracting post ID from URL...');
      }

      // Extract post ID from URL
      const postId = this.extractPostId(url);
      if (!postId) {
        throw new Error('Invalid Instagram URL - could not extract post ID');
      }

      console.log(`📝 Post ID: ${postId}`);

      // Fetch the post content using curl
      const html = await this.fetchPostWithCurl(url, progressCallback);

      // Parse the HTML content
      const result = await this.parseInstagramContent(html, progressCallback);

      console.log(`✅ Instagram scraping completed: ${result.comments.length} comments found`);
      return result;

    } catch (error) {
      console.error('❌ Instagram scraping failed:', error.message);
      throw new Error(`Instagram scraping failed: ${error.message}`);
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
      userAgents: this.userAgents.length
    };
  }
}

module.exports = InstagramAPIService;

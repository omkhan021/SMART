const { TwitterApi } = require('twitter-api-v2');
const rateLimit = require('express-rate-limit');

class TwitterAPIService {
  constructor() {
    // Initialize Twitter API client with your credentials
    this.client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY || 'yNmKWFGA9y66L9yAAJ4oB4Hgf',
      appSecret: process.env.TWITTER_API_SECRET || 'GQQgdK9kNdBCCyC9ESAAZ9bNmRO9oX36bl3ZpfAsUEfe8kGX8E',
      accessToken: process.env.TWITTER_ACCESS_TOKEN || '1682803693-prsovYjUdGYkso6ExL55ylflB4c9yl2MzfswG47',
      accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET || 'djrvFY8F0MkPbVy1wyBazFj8IUuOCCenBghV1jQRR5hXp',
    });

    // Rate limiting configuration
    this.rateLimits = {
      tweets: {
        limit: parseInt(process.env.TWITTER_RATE_LIMIT_TWEETS_PER_15_MIN) || 300,
        windowMs: 15 * 60 * 1000, // 15 minutes
        remaining: 300,
        resetTime: null
      },
      users: {
        limit: parseInt(process.env.TWITTER_RATE_LIMIT_USERS_PER_15_MIN) || 300,
        windowMs: 15 * 60 * 1000,
        remaining: 300,
        resetTime: null
      },
      timeline: {
        limit: parseInt(process.env.TWITTER_RATE_LIMIT_TIMELINE_PER_15_MIN) || 75,
        windowMs: 15 * 60 * 1000,
        remaining: 75,
        resetTime: null
      }
    };

    // Request queue to manage rate limits
    this.requestQueue = [];
    this.isProcessing = false;
  }

  /**
   * Check if we can make a request based on rate limits
   */
  canMakeRequest(type) {
    const rateLimit = this.rateLimits[type];
    if (!rateLimit) return true;

    // Check if rate limit window has reset
    if (rateLimit.resetTime && Date.now() > rateLimit.resetTime) {
      rateLimit.remaining = rateLimit.limit;
      rateLimit.resetTime = null;
    }

    return rateLimit.remaining > 0;
  }

  /**
   * Update rate limit info from API response headers
   */
  updateRateLimit(type, headers) {
    const rateLimit = this.rateLimits[type];
    if (!rateLimit || !headers) return;

    const remaining = parseInt(headers['x-rate-limit-remaining']);
    const reset = parseInt(headers['x-rate-limit-reset']);

    if (!isNaN(remaining)) {
      rateLimit.remaining = remaining;
    }

    if (!isNaN(reset)) {
      rateLimit.resetTime = reset * 1000; // Convert to milliseconds
    }
  }

  /**
   * Wait for rate limit to reset if needed
   */
  async waitForRateLimit(type) {
    const rateLimit = this.rateLimits[type];
    if (!rateLimit || rateLimit.remaining > 0) return;

    if (rateLimit.resetTime) {
      const waitTime = rateLimit.resetTime - Date.now();
      if (waitTime > 0) {
        console.log(`⏳ Waiting ${Math.ceil(waitTime / 1000)} seconds for rate limit reset...`);
        await new Promise(resolve => setTimeout(resolve, waitTime + 1000));
      }
    }
  }

  /**
   * Handle rate limit with exponential backoff
   */
  async handleRateLimit(error, retryCount = 0) {
    if (error.code === 429) {
      const maxRetries = 3;
      if (retryCount >= maxRetries) {
        throw new Error(`Rate limit exceeded. Maximum retries (${maxRetries}) reached. Please try again later.`);
      }

      const backoffTime = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
      console.log(`⏳ Rate limit hit. Waiting ${backoffTime}ms before retry ${retryCount + 1}/${maxRetries}...`);
      
      await new Promise(resolve => setTimeout(resolve, backoffTime));
      return true; // Indicates we should retry
    }
    return false; // Don't retry for other errors
  }

  /**
   * Extract tweet ID from Twitter URL
   */
  extractTweetId(url) {
    const patterns = [
      /twitter\.com\/\w+\/status\/(\d+)/,
      /x\.com\/\w+\/status\/(\d+)/,
      /t\.co\/\w+/
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
   * Get tweet by ID
   */
  async getTweet(tweetId, progressCallback = null, retryCount = 0) {
    try {
      console.log(`🐦 Fetching tweet ${tweetId}...`);
      
      const tweet = await this.client.v2.singleTweet(tweetId, {
        'tweet.fields': [
          'id', 'text', 'author_id', 'created_at', 'public_metrics',
          'context_annotations', 'entities', 'lang'
        ],
        'user.fields': ['id', 'username', 'name', 'public_metrics'],
        'expansions': ['author_id']
      });

      // Update rate limit from response headers
      this.updateRateLimit('tweets', tweet._headers);

      console.log(`✅ Tweet fetched: ${tweet.data.text.substring(0, 50)}...`);
      return tweet;

    } catch (error) {
      console.error(`❌ Error fetching tweet ${tweetId}:`, error.message);
      
      // Handle rate limiting with exponential backoff
      if (await this.handleRateLimit(error, retryCount)) {
        return this.getTweet(tweetId, progressCallback, retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * Get replies to a tweet
   */
  async getTweetReplies(tweetId, maxResults = 100, progressCallback = null, retryCount = 0) {
    try {
      console.log(`🐦 Fetching replies for tweet ${tweetId}...`);
      
      const replies = await this.client.v2.search(`conversation_id:${tweetId}`, {
        'tweet.fields': [
          'id', 'text', 'author_id', 'created_at', 'public_metrics',
          'context_annotations', 'entities', 'lang', 'in_reply_to_user_id'
        ],
        'user.fields': ['id', 'username', 'name', 'public_metrics', 'verified'],
        'expansions': ['author_id'],
        'max_results': Math.min(maxResults, 100) // Twitter API limit
      });

      // Update rate limit
      this.updateRateLimit('tweets', replies._headers);

      console.log(`✅ Found ${replies.data?.data?.length || 0} replies`);
      return replies;

    } catch (error) {
      console.error(`❌ Error fetching replies for tweet ${tweetId}:`, error.message);
      
      // Handle rate limiting with exponential backoff
      if (await this.handleRateLimit(error, retryCount)) {
        return this.getTweetReplies(tweetId, maxResults, progressCallback, retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * Get user information
   */
  async getUserInfo(userId, progressCallback = null) {
    if (!this.canMakeRequest('users')) {
      await this.waitForRateLimit('users');
    }

    try {
      console.log(`👤 Fetching user info for ${userId}...`);
      
      const user = await this.client.v2.user(userId, {
        'user.fields': [
          'id', 'username', 'name', 'public_metrics', 'verified',
          'description', 'location', 'created_at', 'profile_image_url'
        ]
      });

      // Update rate limit
      this.updateRateLimit('users', user._headers);

      console.log(`✅ User info fetched: @${user.data.username}`);
      return user;

    } catch (error) {
      console.error(`❌ Error fetching user ${userId}:`, error.message);
      
      if (error.code === 429) {
        await this.waitForRateLimit('users');
        return this.getUserInfo(userId, progressCallback);
      }
      
      throw error;
    }
  }

  /**
   * Scrape a Twitter post and its replies
   */
  async scrapeTwitterPost(url, progressCallback = null) {
    try {
      console.log(`🚀 Starting Twitter scraping for: ${url}`);
      
      if (progressCallback) {
        progressCallback(10, 'Extracting tweet ID from URL...');
      }

      // Extract tweet ID from URL
      const tweetId = this.extractTweetId(url);
      if (!tweetId) {
        throw new Error('Invalid Twitter URL - could not extract tweet ID');
      }

      console.log(`📝 Tweet ID: ${tweetId}`);

      if (progressCallback) {
        progressCallback(20, 'Fetching tweet details...');
      }

      // Get the main tweet
      const tweetResponse = await this.getTweet(tweetId, progressCallback);
      const tweet = tweetResponse.data;
      const author = tweetResponse.includes?.users?.[0];

      if (progressCallback) {
        progressCallback(40, 'Fetching replies...');
      }

      // Get replies (with error handling)
      let replies = [];
      let replyUsers = [];
      
      try {
        const repliesResponse = await this.getTweetReplies(tweetId, 100, progressCallback);
        replies = repliesResponse.data?.data || [];
        replyUsers = repliesResponse.includes?.users || [];
      } catch (replyError) {
        console.warn(`⚠️ Could not fetch replies: ${replyError.message}`);
        // Continue with empty replies rather than failing completely
      }

      if (progressCallback) {
        progressCallback(70, 'Processing data...');
      }

      // Format the data
      const formattedData = {
        post: {
          id: tweet.id,
          author: author?.username || 'unknown',
          content: tweet.text,
          platform: 'twitter',
          total_comments: replies.length,
          likes_count: tweet.public_metrics?.like_count || 0,
          retweets_count: tweet.public_metrics?.retweet_count || 0,
          created_at: tweet.created_at
        },
        comments: replies.map(reply => {
          const replyUser = replyUsers.find(u => u.id === reply.author_id);
          return {
            id: reply.id,
            username: replyUser?.username || 'unknown',
            comment_text: reply.text,
            timestamp: reply.created_at,
            likes_count: reply.public_metrics?.like_count || 0,
            reply_count: reply.public_metrics?.reply_count || 0,
            retweets_count: reply.public_metrics?.retweet_count || 0
          };
        }),
        users: replyUsers.map(user => ({
          username: user.username,
          name: user.name,
          verified: user.verified,
          followers_count: user.public_metrics?.followers_count || 0,
          following_count: user.public_metrics?.following_count || 0,
          tweet_count: user.public_metrics?.tweet_count || 0,
          profile_image_url: user.profile_image_url,
          description: user.description,
          location: user.location
        }))
      };

      if (progressCallback) {
        progressCallback(100, 'Twitter scraping completed!');
      }

      console.log(`✅ Twitter scraping completed: ${formattedData.comments.length} replies found`);
      return formattedData;

    } catch (error) {
      console.error('❌ Twitter scraping failed:', error.message);
      
      // If it's a rate limit error, provide a more helpful message
      if (error.message.includes('Rate limit exceeded')) {
        throw new Error('Twitter API rate limit exceeded. Please try again in a few minutes.');
      }
      
      throw new Error(`Twitter scraping failed: ${error.message}`);
    }
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus() {
    return {
      tweets: {
        remaining: this.rateLimits.tweets.remaining,
        limit: this.rateLimits.tweets.limit,
        resetTime: this.rateLimits.tweets.resetTime
      },
      users: {
        remaining: this.rateLimits.users.remaining,
        limit: this.rateLimits.users.limit,
        resetTime: this.rateLimits.users.resetTime
      },
      timeline: {
        remaining: this.rateLimits.timeline.remaining,
        limit: this.rateLimits.timeline.limit,
        resetTime: this.rateLimits.timeline.resetTime
      }
    };
  }
}

module.exports = TwitterAPIService;

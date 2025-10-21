const puppeteer = require('puppeteer');
const UserAgent = require('user-agents');
const URLParser = require('../utils/urlParser');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class WebScraper {
  constructor() {
    this.browser = null;
    this.urlParser = new URLParser();
    this.userAgents = new UserAgent();
  }

  /**
   * Initialize browser instance
   */
  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
    }
    return this.browser;
  }

  /**
   * Close browser instance
   */
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Scrape comments from a social media post
   * @param {string} url - The post URL
   * @param {Function} progressCallback - Callback for progress updates
   * @returns {Object} - Scraped data
   */
  async scrapePost(url, progressCallback = () => {}) {
    const parsedUrl = this.urlParser.parseURL(url);
    
    if (!parsedUrl.isValid) {
      throw new Error(`Invalid URL: ${parsedUrl.error}`);
    }

    let browser;
    let page;
    
    try {
      browser = await this.initBrowser();
      page = await browser.newPage();
    } catch (error) {
      if (error.message.includes('socket hang up') || error.message.includes('ECONNRESET')) {
        throw new Error(`${parsedUrl.platform} is blocking automated access. Please try a different platform.`);
      }
      throw error;
    }

    try {
      // Set random user agent
      const userAgent = this.userAgents.random();
      await page.setUserAgent(userAgent.toString());

      // Set viewport
      await page.setViewport({ width: 1366, height: 768 });

      // Add enhanced stealth measures for X/Twitter
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        });
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en'],
        });
        window.chrome = {
          runtime: {},
        };
      });

      // Set additional headers for X/Twitter
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
      });

      progressCallback(10, 'Navigating to post...');

      // Navigate to the post with better handling for X/Twitter
      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 45000 
      });

      progressCallback(20, 'Page loaded, extracting post data...');

      // Extract post data and comments based on platform
      const scrapedData = await this.extractDataByPlatform(page, parsedUrl.platform, progressCallback);

      progressCallback(100, 'Scraping completed');

      return scrapedData;

    } catch (error) {
      console.error('Scraping error:', error);
      if (error.message.includes('socket hang up') || error.message.includes('ECONNRESET')) {
        throw new Error(`${parsedUrl.platform} is blocking automated access. Please try a different platform.`);
      }
      throw new Error(`Failed to scrape post: ${error.message}`);
    } finally {
      if (page) {
        await page.close();
      }
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Extract data based on platform
   * @param {Object} page - Puppeteer page object
   * @param {string} platform - Platform name
   * @param {Function} progressCallback - Progress callback
   * @returns {Object} - Extracted data
   */
  async extractDataByPlatform(page, platform, progressCallback) {
    switch (platform) {
      case 'instagram':
        return await this.scrapeInstagram(page, progressCallback);
      case 'threads':
        return await this.scrapeThreads(page, progressCallback);
      case 'facebook':
        return await this.scrapeFacebook(page, progressCallback);
      case 'twitter':
        return await this.scrapeTwitter(page, progressCallback);
      case 'truth_social':
        return await this.scrapeTruthSocial(page, progressCallback);
      case 'tiktok':
        return await this.scrapeTikTok(page, progressCallback);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  /**
   * Scrape Instagram post
   */
  async scrapeInstagram(page, progressCallback) {
    progressCallback(30, 'Extracting Instagram post data...');

    const postData = await page.evaluate(() => {
      // Extract post author
      const authorElement = document.querySelector('header h2 a, header h2 span');
      const author = authorElement ? authorElement.textContent.trim() : null;

      // Extract post content
      const contentElement = document.querySelector('article div[data-testid="post-caption"] span');
      const content = contentElement ? contentElement.textContent.trim() : null;

      return { author, content };
    });

    progressCallback(40, 'Loading Instagram comments...');

    // Scroll to load comments
    await this.scrollToLoadComments(page);

    progressCallback(60, 'Extracting Instagram comments...');

    const comments = await page.evaluate(() => {
      const commentElements = document.querySelectorAll('article div[role="button"]');
      const extractedComments = [];

      commentElements.forEach((element, index) => {
        try {
          const usernameElement = element.querySelector('h3 a, h3 span');
          const textElement = element.querySelector('span');
          const timeElement = element.querySelector('time');
          const likesElement = element.querySelector('button span');

          if (usernameElement && textElement) {
            const username = usernameElement.textContent.trim();
            const text = textElement.textContent.trim();
            const timestamp = timeElement ? timeElement.getAttribute('datetime') : null;
            const likes = likesElement ? parseInt(likesElement.textContent.replace(/\D/g, '')) || 0 : 0;

            if (username && text && text.length > 0) {
              extractedComments.push({
                username,
                text,
                timestamp,
                likes,
                replyCount: 0 // Instagram doesn't show reply counts easily
              });
            }
          }
        } catch (error) {
          console.warn(`Error extracting comment ${index}:`, error);
        }
      });

      return extractedComments;
    });

    return {
      platform: 'instagram',
      postData,
      comments: comments.slice(0, 1000), // Limit to prevent memory issues
      totalComments: comments.length
    };
  }

  /**
   * Scrape Threads post
   */
  async scrapeThreads(page, progressCallback) {
    progressCallback(30, 'Extracting Threads post data...');

    const postData = await page.evaluate(() => {
      const authorElement = document.querySelector('header h1 a');
      const author = authorElement ? authorElement.textContent.trim() : null;

      const contentElement = document.querySelector('div[data-testid="post-text"]');
      const content = contentElement ? contentElement.textContent.trim() : null;

      return { author, content };
    });

    progressCallback(40, 'Loading Threads comments...');
    await this.scrollToLoadComments(page);

    progressCallback(60, 'Extracting Threads comments...');

    const comments = await page.evaluate(() => {
      const commentElements = document.querySelectorAll('div[data-testid="post"]');
      const extractedComments = [];

      commentElements.forEach((element) => {
        try {
          const usernameElement = element.querySelector('header h1 a');
          const textElement = element.querySelector('div[data-testid="post-text"]');
          const timeElement = element.querySelector('time');
          const likesElement = element.querySelector('button[aria-label*="like"] span');

          if (usernameElement && textElement) {
            const username = usernameElement.textContent.trim();
            const text = textElement.textContent.trim();
            const timestamp = timeElement ? timeElement.getAttribute('datetime') : null;
            const likes = likesElement ? parseInt(likesElement.textContent.replace(/\D/g, '')) || 0 : 0;

            if (username && text && text.length > 0) {
              extractedComments.push({
                username,
                text,
                timestamp,
                likes,
                replyCount: 0
              });
            }
          }
        } catch (error) {
          console.warn('Error extracting Threads comment:', error);
        }
      });

      return extractedComments;
    });

    return {
      platform: 'threads',
      postData,
      comments: comments.slice(0, 1000),
      totalComments: comments.length
    };
  }

  /**
   * Scrape Facebook post
   */
  async scrapeFacebook(page, progressCallback) {
    progressCallback(30, 'Extracting Facebook post data...');

    const postData = await page.evaluate(() => {
      const authorElement = document.querySelector('h1 a, strong a');
      const author = authorElement ? authorElement.textContent.trim() : null;

      const contentElement = document.querySelector('[data-testid="post_message"]');
      const content = contentElement ? contentElement.textContent.trim() : null;

      return { author, content };
    });

    progressCallback(40, 'Loading Facebook comments...');
    await this.scrollToLoadComments(page);

    progressCallback(60, 'Extracting Facebook comments...');

    const comments = await page.evaluate(() => {
      const commentElements = document.querySelectorAll('[data-testid="UFI2Comment/root_depth_0"]');
      const extractedComments = [];

      commentElements.forEach((element) => {
        try {
          const usernameElement = element.querySelector('strong a');
          const textElement = element.querySelector('[data-testid="UFI2Comment/body"]');
          const timeElement = element.querySelector('a[role="link"] abbr');
          const likesElement = element.querySelector('[data-testid="UFI2Comment/like_counter"]');

          if (usernameElement && textElement) {
            const username = usernameElement.textContent.trim();
            const text = textElement.textContent.trim();
            const timestamp = timeElement ? timeElement.getAttribute('title') : null;
            const likes = likesElement ? parseInt(likesElement.textContent.replace(/\D/g, '')) || 0 : 0;

            if (username && text && text.length > 0) {
              extractedComments.push({
                username,
                text,
                timestamp,
                likes,
                replyCount: 0
              });
            }
          }
        } catch (error) {
          console.warn('Error extracting Facebook comment:', error);
        }
      });

      return extractedComments;
    });

    return {
      platform: 'facebook',
      postData,
      comments: comments.slice(0, 1000),
      totalComments: comments.length
    };
  }

  /**
   * Scrape Twitter/X post
   */
  async scrapeTwitter(page, progressCallback) {
    try {
      // Wait for page to load and handle potential blocking
      progressCallback(20, 'Waiting for X/Twitter to load...');
      await page.waitForTimeout(5000);
      
      // Check if we're blocked or redirected
      const currentUrl = page.url();
      if (currentUrl.includes('challenge') || currentUrl.includes('error') || currentUrl.includes('something-went-wrong')) {
        throw new Error('X/Twitter is blocking automated access. Please try a different platform or use X\'s official API.');
      }

      // Try to detect if the page loaded properly
      const pageContent = await page.content();
      if (pageContent.includes('Something went wrong') || pageContent.includes('Try again') || pageContent.includes('This page doesn\'t exist')) {
        throw new Error('X/Twitter is experiencing issues or blocking automated access. Please try a different platform.');
      }

      // Check if we got redirected to login
      if (currentUrl.includes('login') || currentUrl.includes('signin')) {
        throw new Error('X/Twitter requires login. Please try a different platform.');
      }
    } catch (error) {
      if (error.message.includes('socket hang up') || error.message.includes('ECONNRESET')) {
        throw new Error('X/Twitter is blocking automated access. Please try Instagram, Facebook, or another platform.');
      }
      throw error;
    }

    progressCallback(30, 'Extracting Twitter post data...');

    const postData = await page.evaluate(() => {
      // Try multiple selectors for X's changing structure
      const authorElement = document.querySelector('[data-testid="User-Name"] a') || 
                           document.querySelector('a[href*="/"] span') ||
                           document.querySelector('[role="link"] span');
      const author = authorElement ? authorElement.textContent.trim() : null;

      const contentElement = document.querySelector('[data-testid="tweetText"]') ||
                           document.querySelector('[data-testid="post-text"]') ||
                           document.querySelector('div[lang]');
      const content = contentElement ? contentElement.textContent.trim() : null;

      return { author, content };
    });

    progressCallback(40, 'Loading Twitter comments...');
    await this.scrollToLoadComments(page);

    progressCallback(60, 'Extracting Twitter comments...');

    const comments = await page.evaluate(() => {
      const commentElements = document.querySelectorAll('[data-testid="tweet"]');
      const extractedComments = [];

      commentElements.forEach((element) => {
        try {
          const usernameElement = element.querySelector('[data-testid="User-Name"] a');
          const textElement = element.querySelector('[data-testid="tweetText"]');
          const timeElement = element.querySelector('time');
          const likesElement = element.querySelector('[data-testid="like"] span');

          if (usernameElement && textElement) {
            const username = usernameElement.textContent.trim();
            const text = textElement.textContent.trim();
            const timestamp = timeElement ? timeElement.getAttribute('datetime') : null;
            const likes = likesElement ? parseInt(likesElement.textContent.replace(/\D/g, '')) || 0 : 0;

            if (username && text && text.length > 0) {
              extractedComments.push({
                username,
                text,
                timestamp,
                likes,
                replyCount: 0
              });
            }
          }
        } catch (error) {
          console.warn('Error extracting Twitter comment:', error);
        }
      });

      return extractedComments;
    });

    return {
      platform: 'twitter',
      postData,
      comments: comments.slice(0, 1000),
      totalComments: comments.length
    };
  }

  /**
   * Scrape Truth Social post
   */
  async scrapeTruthSocial(page, progressCallback) {
    progressCallback(30, 'Extracting Truth Social post data...');

    const postData = await page.evaluate(() => {
      const authorElement = document.querySelector('.username');
      const author = authorElement ? authorElement.textContent.trim() : null;

      const contentElement = document.querySelector('.post-content');
      const content = contentElement ? contentElement.textContent.trim() : null;

      return { author, content };
    });

    progressCallback(40, 'Loading Truth Social comments...');
    await this.scrollToLoadComments(page);

    progressCallback(60, 'Extracting Truth Social comments...');

    const comments = await page.evaluate(() => {
      const commentElements = document.querySelectorAll('.comment');
      const extractedComments = [];

      commentElements.forEach((element) => {
        try {
          const usernameElement = element.querySelector('.username');
          const textElement = element.querySelector('.comment-content');
          const timeElement = element.querySelector('.timestamp');
          const likesElement = element.querySelector('.like-count');

          if (usernameElement && textElement) {
            const username = usernameElement.textContent.trim();
            const text = textElement.textContent.trim();
            const timestamp = timeElement ? timeElement.textContent.trim() : null;
            const likes = likesElement ? parseInt(likesElement.textContent.replace(/\D/g, '')) || 0 : 0;

            if (username && text && text.length > 0) {
              extractedComments.push({
                username,
                text,
                timestamp,
                likes,
                replyCount: 0
              });
            }
          }
        } catch (error) {
          console.warn('Error extracting Truth Social comment:', error);
        }
      });

      return extractedComments;
    });

    return {
      platform: 'truth_social',
      postData,
      comments: comments.slice(0, 1000),
      totalComments: comments.length
    };
  }

  /**
   * Scrape TikTok post
   */
  async scrapeTikTok(page, progressCallback) {
    progressCallback(30, 'Extracting TikTok post data...');

    const postData = await page.evaluate(() => {
      const authorElement = document.querySelector('[data-e2e="video-author-uniqueid"]');
      const author = authorElement ? authorElement.textContent.trim() : null;

      const contentElement = document.querySelector('[data-e2e="video-desc"]');
      const content = contentElement ? contentElement.textContent.trim() : null;

      return { author, content };
    });

    progressCallback(40, 'Loading TikTok comments...');
    await this.scrollToLoadComments(page);

    progressCallback(60, 'Extracting TikTok comments...');

    const comments = await page.evaluate(() => {
      const commentElements = document.querySelectorAll('[data-e2e="comment-item"]');
      const extractedComments = [];

      commentElements.forEach((element) => {
        try {
          const usernameElement = element.querySelector('[data-e2e="comment-username"]');
          const textElement = element.querySelector('[data-e2e="comment-level1"]');
          const timeElement = element.querySelector('[data-e2e="comment-time"]');
          const likesElement = element.querySelector('[data-e2e="comment-like-count"]');

          if (usernameElement && textElement) {
            const username = usernameElement.textContent.trim();
            const text = textElement.textContent.trim();
            const timestamp = timeElement ? timeElement.textContent.trim() : null;
            const likes = likesElement ? parseInt(likesElement.textContent.replace(/\D/g, '')) || 0 : 0;

            if (username && text && text.length > 0) {
              extractedComments.push({
                username,
                text,
                timestamp,
                likes,
                replyCount: 0
              });
            }
          }
        } catch (error) {
          console.warn('Error extracting TikTok comment:', error);
        }
      });

      return extractedComments;
    });

    return {
      platform: 'tiktok',
      postData,
      comments: comments.slice(0, 1000),
      totalComments: comments.length
    };
  }

  /**
   * Scroll page to load more comments
   * @param {Object} page - Puppeteer page object
   */
  async scrollToLoadComments(page) {
    let previousHeight = 0;
    let currentHeight = await page.evaluate('document.body.scrollHeight');
    let scrollAttempts = 0;
    const maxScrollAttempts = 10;

    while (currentHeight > previousHeight && scrollAttempts < maxScrollAttempts) {
      previousHeight = currentHeight;
      
      // Scroll down
      await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      
      // Wait for new content to load
      await page.waitForTimeout(2000);
      
      currentHeight = await page.evaluate('document.body.scrollHeight');
      scrollAttempts++;
    }

    // Scroll back to top
    await page.evaluate('window.scrollTo(0, 0)');
    await page.waitForTimeout(1000);
  }
}

module.exports = WebScraper;

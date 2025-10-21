const TwitterAPIService = require('./twitterAPIService');
const InstagramAPIService = require('./instagramAPIService');
const FacebookAPIService = require('./facebookAPIService');
const TikTokAPIService = require('./tiktokAPIService');
const ThreadsAPIService = require('./threadsAPIService');
const TruthSocialAPIService = require('./truthSocialAPIService');

class PlatformService {
  constructor() {
    // Initialize all platform services
    this.services = {
      twitter: new TwitterAPIService(),
      instagram: new InstagramAPIService(),
      facebook: new FacebookAPIService(),
      tiktok: new TikTokAPIService(),
      threads: new ThreadsAPIService(),
      truth_social: new TruthSocialAPIService()
    };
  }

  /**
   * Get the appropriate service for a platform
   */
  getService(platform) {
    return this.services[platform];
  }

  /**
   * Scrape a post from any platform
   */
  async scrapePost(url, platform, progressCallback = null) {
    const service = this.getService(platform);
    
    if (!service) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    if (!service.isConfigured()) {
      throw new Error(`${platform} service is not configured`);
    }

    console.log(`🚀 Using ${platform} service for: ${url}`);

    // Call the appropriate scraping method based on platform
    switch (platform) {
      case 'twitter':
        return await service.scrapeTwitterPost(url, progressCallback);
      case 'instagram':
        return await service.scrapeInstagramPost(url, progressCallback);
      case 'facebook':
        return await service.scrapeFacebookPost(url, progressCallback);
      case 'tiktok':
        return await service.scrapeTikTokVideo(url, progressCallback);
      case 'threads':
        return await service.scrapeThreadsPost(url, progressCallback);
      case 'truth_social':
        return await service.scrapeTruthSocialPost(url, progressCallback);
      default:
        throw new Error(`No scraping method available for platform: ${platform}`);
    }
  }

  /**
   * Get status of all platform services
   */
  getAllServicesStatus() {
    const status = {};
    
    for (const [platform, service] of Object.entries(this.services)) {
      status[platform] = service.getStatus ? service.getStatus() : {
        configured: service.isConfigured(),
        method: 'unknown'
      };
    }

    return status;
  }

  /**
   * Get status of a specific platform service
   */
  getServiceStatus(platform) {
    const service = this.getService(platform);
    
    if (!service) {
      return { configured: false, error: `Unsupported platform: ${platform}` };
    }

    return service.getStatus ? service.getStatus() : {
      configured: service.isConfigured(),
      method: 'unknown'
    };
  }

  /**
   * Check if a platform is supported
   */
  isPlatformSupported(platform) {
    return this.services.hasOwnProperty(platform);
  }

  /**
   * Get list of supported platforms
   */
  getSupportedPlatforms() {
    return Object.keys(this.services);
  }

  /**
   * Get list of configured platforms
   */
  getConfiguredPlatforms() {
    const configured = [];
    
    for (const [platform, service] of Object.entries(this.services)) {
      if (service.isConfigured()) {
        configured.push(platform);
      }
    }

    return configured;
  }
}

module.exports = PlatformService;

const { v4: uuidv4 } = require('uuid');

class MockAnalyzer {
  constructor() {
    this.mockComments = [
      {
        username: 'user123',
        text: 'This is amazing! Love it so much! 😍',
        timestamp: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
        likes: Math.floor(Math.random() * 50) + 1,
        replyCount: Math.floor(Math.random() * 5)
      },
      {
        username: 'cool_guy',
        text: 'Not really impressed with this. Could be better.',
        timestamp: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
        likes: Math.floor(Math.random() * 20) + 1,
        replyCount: Math.floor(Math.random() * 3)
      },
      {
        username: 'happy_user',
        text: 'Great content! Keep it up! 👍',
        timestamp: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
        likes: Math.floor(Math.random() * 30) + 1,
        replyCount: Math.floor(Math.random() * 2)
      },
      {
        username: 'skeptic_99',
        text: 'I have mixed feelings about this. Some parts are good, others not so much.',
        timestamp: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
        likes: Math.floor(Math.random() * 15) + 1,
        replyCount: Math.floor(Math.random() * 4)
      },
      {
        username: 'enthusiast_42',
        text: 'Absolutely fantastic! This made my day! 🎉',
        timestamp: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
        likes: Math.floor(Math.random() * 40) + 1,
        replyCount: Math.floor(Math.random() * 6)
      }
    ];
  }

  async generateMockAnalysis(url, progressCallback) {
    console.log('🎭 Generating mock analysis for:', url);
    
    // Determine platform from URL
    const platform = this.getPlatformFromUrl(url);
    console.log('🎭 Detected platform:', platform);
    
    // Simulate progress
    await this.simulateProgress(progressCallback);
    
    // Generate mock comments with proper sentiment analysis
    const commentCount = Math.floor(Math.random() * 30) + 20;
    const mockComments = [];
    
    for (let i = 0; i < commentCount; i++) {
      const baseComment = this.mockComments[Math.floor(Math.random() * this.mockComments.length)];
      const commentText = this.generateVariation(baseComment.text);
      const analysis = this.analyzeSentiment(commentText);
      
      mockComments.push({
        username: `${baseComment.username}_${i}`,
        text: commentText,
        timestamp: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
        likes: Math.floor(Math.random() * 100) + 1,
        replyCount: Math.floor(Math.random() * 10),
        analysis: analysis
      });
    }

    // Generate demographic data
    const demographics = this.generateDemographics(mockComments);

    return {
      postData: {
        author: this.getPlatformAuthor(platform),
        content: this.getPlatformContent(platform),
        url: url
      },
      comments: mockComments,
      totalComments: mockComments.length,
      demographics: demographics
    };
  }

  getPlatformFromUrl(url) {
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('facebook.com')) return 'facebook';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
    if (url.includes('tiktok.com')) return 'tiktok';
    if (url.includes('threads.net')) return 'threads';
    if (url.includes('truthsocial.com')) return 'truth_social';
    return 'generic';
  }

  getPlatformAuthor(platform) {
    const authors = {
      instagram: 'demo_instagram_user',
      facebook: 'Demo Facebook User',
      twitter: '@demo_twitter_user',
      tiktok: 'demo_tiktok_creator',
      threads: '@demo_threads_user',
      truth_social: '@demo_truth_user',
      generic: 'demo_social_user'
    };
    return authors[platform] || 'demo_user';
  }

  getPlatformContent(platform) {
    const content = {
      instagram: 'Check out this amazing photo! 📸 #photography #instagood',
      facebook: 'Just had an incredible experience! Thanks to everyone who made it possible.',
      twitter: 'Just had a thought about the future of technology. What do you all think?',
      tiktok: 'POV: When you finally figure out the dance move everyone else already knew 😅',
      threads: 'Sharing some thoughts on the latest developments in social media.',
      truth_social: 'Important discussion about current events and their impact.',
      generic: 'This is a demo post for testing the sentiment analysis system.'
    };
    return content[platform] || 'This is a demo post for testing the sentiment analysis system.';
  }

  generateVariation(text) {
    const variations = [
      text,
      text + ' Really!',
      'I think ' + text.toLowerCase(),
      text.replace(/!/g, '!!'),
      'Honestly, ' + text.toLowerCase()
    ];
    return variations[Math.floor(Math.random() * variations.length)];
  }

  analyzeSentiment(text) {
    const positiveWords = ['amazing', 'love', 'great', 'fantastic', 'awesome', 'wonderful', 'perfect', 'excellent', 'keep it up', 'made my day', 'absolutely fantastic'];
    const negativeWords = ['terrible', 'hate', 'awful', 'bad', 'horrible', 'disappointed', 'sucks', 'worst', 'not impressed', 'could be better', 'mixed feelings'];
    
    const lowerText = text.toLowerCase();
    const positiveScore = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeScore = negativeWords.filter(word => lowerText.includes(word)).length;
    
    let sentiment = 'neutral';
    let emotion = 'neutral';
    let abuseLevel = 'safe';
    let confidence = 0.6 + Math.random() * 0.3;
    
    if (positiveScore > negativeScore) {
      sentiment = 'positive';
      emotion = 'joy';
      confidence = 0.75 + Math.random() * 0.2;
    } else if (negativeScore > positiveScore) {
      sentiment = 'negative';
      emotion = Math.random() > 0.5 ? 'anger' : 'disgust';
      confidence = 0.75 + Math.random() * 0.2;
      // Some negative comments might be toxic
      if (Math.random() > 0.85) {
        abuseLevel = 'toxic';
      }
    }
    
    return {
      sentiment,
      emotion,
      abuse_level: abuseLevel,
      confidence_score: confidence,
      reasoning: `Mock sentiment analysis: ${sentiment} sentiment detected with ${(confidence * 100).toFixed(1)}% confidence`
    };
  }

  generateDemographics(comments) {
    const usernames = [...new Set(comments.map(c => c.username))];
    
    return usernames.map(username => ({
      username,
      predicted_age: 18 + Math.floor(Math.random() * 50),
      age_confidence: 0.6 + Math.random() * 0.3,
      predicted_gender: Math.random() > 0.5 ? 'male' : 'female',
      gender_confidence: 0.5 + Math.random() * 0.4,
      predicted_location_country: this.getRandomCountry(),
      predicted_location_state: this.getRandomState(),
      predicted_location_city: this.getRandomCity(),
      location_confidence: 0.4 + Math.random() * 0.5
    }));
  }

  getRandomCountry() {
    const countries = ['United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France', 'Japan', 'Brazil'];
    return countries[Math.floor(Math.random() * countries.length)];
  }

  getRandomState() {
    const states = ['California', 'New York', 'Texas', 'Florida', 'Illinois', 'Pennsylvania', 'Ohio', 'Georgia'];
    return states[Math.floor(Math.random() * states.length)];
  }

  getRandomCity() {
    const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego'];
    return cities[Math.floor(Math.random() * cities.length)];
  }

  async simulateProgress(progressCallback) {
    const steps = [
      { progress: 20, message: 'Scraping comments...' },
      { progress: 50, message: 'Analyzing sentiment...' },
      { progress: 80, message: 'Analyzing demographics...' },
      { progress: 95, message: 'Processing results...' }
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      if (progressCallback) {
        progressCallback(step.progress, step.message);
      }
    }
  }
}

module.exports = MockAnalyzer;

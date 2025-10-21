const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { Post, AnalysisJob } = require('../models');
const URLParser = require('../utils/urlParser');
const WebScraper = require('../services/webScraper');
const TwitterAPIService = require('../services/twitterAPIService');
const SentimentAnalyzer = require('../services/sentimentAnalyzer');
const DemographicAnalyzer = require('../services/demographicAnalyzer');
const MockAnalyzer = require('../services/mockAnalyzer');

const router = express.Router();
const urlParser = new URLParser();
const webScraper = new WebScraper();
const twitterAPI = new TwitterAPIService();
const sentimentAnalyzer = new SentimentAnalyzer();
const demographicAnalyzer = new DemographicAnalyzer();
const mockAnalyzer = new MockAnalyzer();

// Validation middleware
const validateAnalysisRequest = [
  body('url')
    .isURL()
    .withMessage('Please provide a valid URL')
    .custom((value, { req }) => {
      // Skip platform validation in mock mode
      if (req.body.mockMode) {
        return true;
      }
      if (!urlParser.isSupportedPlatform(value)) {
        throw new Error('Unsupported platform. Please provide a URL from Instagram, Threads, Facebook, Twitter, Truth Social, or TikTok.');
      }
      return true;
    })
];

/**
 * POST /api/analyze
 * Start analysis of a social media post
 */
router.post('/', validateAnalysisRequest, async (req, res) => {
  try {
    console.log('🚀 POST /api/analyze - Request body:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('❌ Validation failed:', errors.array());
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { url, mockMode = false } = req.body;
    console.log('🔍 Processing URL:', url, 'Mock Mode:', mockMode);
    
    // Parse URL to get platform and post ID
    let parsedUrl;
    if (mockMode) {
      // For mock mode, create a simple parsed URL
      parsedUrl = {
        platform: url.includes('facebook.com') ? 'facebook' : 
                 url.includes('twitter.com') || url.includes('x.com') ? 'twitter' :
                 url.includes('instagram.com') ? 'instagram' :
                 url.includes('tiktok.com') ? 'tiktok' :
                 url.includes('threads.net') ? 'threads' :
                 url.includes('truthsocial.com') ? 'truth_social' : 'instagram',
        postId: 'mock_' + Date.now(),
        username: 'demo_user'
      };
    } else {
      parsedUrl = urlParser.parseURL(url);
    }
    
    // Check if post already exists
    let post = await Post.findOne({
      where: { original_url: url }
    });

    if (post) {
      // If post exists and analysis is completed, return existing results
      if (post.analysis_status === 'completed') {
        const job = await AnalysisJob.findOne({
          where: { post_id: post.id },
          order: [['createdAt', 'DESC']]
        });

        return res.json({
          jobId: job.id,
          status: 'completed',
          message: 'Analysis already completed for this post'
        });
      }
      
      // If post exists but analysis failed, restart analysis
      if (post.analysis_status === 'failed') {
        post.analysis_status = 'pending';
        await post.save();
      }
    } else {
      // Create new post record
      post = await Post.create({
        platform: parsedUrl.platform,
        original_url: url,
        post_id: parsedUrl.postId,
        post_author: parsedUrl.username,
        analysis_status: 'pending'
      });
    }

    // Create analysis job
    console.log('📋 Creating analysis job for post:', post.id);
    const job = await AnalysisJob.create({
      post_id: post.id,
      status: 'pending',
      progress: 0
    });
    console.log('✅ Job created with ID:', job.id);

    // Start background analysis (don't await)
    console.log('🔄 Starting background analysis...');
    startAnalysisJob(job.id, post.id, url, mockMode).catch(error => {
      console.error('💥 Analysis job failed:', error);
    });

    const response = {
      jobId: job.id,
      status: 'pending',
      message: 'Analysis started successfully'
    };
    console.log('✅ Analysis started successfully:', response);
    res.json(response);

  } catch (error) {
    console.error('💥 Analysis request error:', error);
    console.error('💥 Error stack:', error.stack);
    res.status(500).json({
      error: 'Failed to start analysis',
      message: error.message
    });
  }
});

/**
 * GET /api/analyze/status/:jobId
 * Get analysis status
 */
router.get('/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await AnalysisJob.findByPk(jobId, {
      include: [{
        model: Post,
        as: 'post'
      }]
    });

    if (!job) {
      return res.status(404).json({
        error: 'Analysis job not found'
      });
    }

    res.json({
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      totalComments: job.total_comments,
      processedComments: job.processed_comments,
      errorMessage: job.error_message,
      startedAt: job.started_at,
      completedAt: job.completed_at
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      error: 'Failed to get analysis status',
      message: error.message
    });
  }
});

/**
 * Background function to process analysis job
 */
async function startAnalysisJob(jobId, postId, url, mockMode = false) {
  try {
    const job = await AnalysisJob.findByPk(jobId);
    const post = await Post.findByPk(postId);

    if (!job || !post) {
      throw new Error('Job or post not found');
    }

    // Update job status to processing
    job.status = 'processing';
    job.started_at = new Date();
    await job.save();

    post.analysis_status = 'processing';
    await post.save();

    // Step 1: Scrape comments or use mock data
    job.progress = 10;
    await job.save();

    let scrapedData;
    if (mockMode) {
      console.log('🎭 Using mock data for analysis');
      // Parse URL to get platform info for mock data
      const parsedUrl = urlParser.parseURL(url);
      scrapedData = await mockAnalyzer.generateMockAnalysis(url, async (progress, message) => {
        job.progress = Math.min(90, 10 + (progress * 0.8));
        await job.save();
      });
    } else {
      // Check if it's a Twitter URL and use Twitter API
      const parsedUrl = urlParser.parseURL(url);
      if (parsedUrl.platform === 'twitter') {
        console.log('🐦 Using Twitter API for scraping');
        scrapedData = await twitterAPI.scrapeTwitterPost(url, async (progress, message) => {
          job.progress = Math.min(90, 10 + (progress * 0.8));
          await job.save();
        });
      } else {
        console.log('🌐 Using web scraper for other platforms');
        scrapedData = await webScraper.scrapePost(url, async (progress, message) => {
          job.progress = Math.min(90, 10 + (progress * 0.8));
          await job.save();
        });
      }
    }

    // Update post with scraped data
    if (mockMode) {
      // Mock analyzer returns postData instead of post
      post.post_author = scrapedData.postData.author;
      post.post_content = scrapedData.postData.content;
      post.total_comments = scrapedData.totalComments;
    } else {
      // Real scrapers return post
      post.post_author = scrapedData.post.author;
      post.post_content = scrapedData.post.content;
      post.total_comments = scrapedData.post.total_comments;
    }
    await post.save();

    job.total_comments = mockMode ? scrapedData.totalComments : scrapedData.post.total_comments;
    job.progress = 90;
    await job.save();

    // Step 2: Analyze sentiment and demographics
    let analyzedComments, demographicResults;
    
    if (mockMode) {
      // Comments already have analysis data from mock analyzer
      analyzedComments = scrapedData.comments;
      demographicResults = scrapedData.demographics;
      job.progress = 98;
      await job.save();
    } else {
      // Use real analyzers
      analyzedComments = await sentimentAnalyzer.analyzeCommentsBatch(
        scrapedData.comments,
        async (progress, message) => {
          job.progress = Math.min(95, 90 + (progress * 0.05));
          job.processed_comments = Math.round((progress / 100) * scrapedData.comments.length);
          await job.save();
        }
      );

      // Step 3: Analyze demographics
      const uniqueUsers = [...new Set(scrapedData.comments.map(c => c.username))];
      
      // For Twitter API, we have additional user data available
      let userData;
      if (scrapedData.users && scrapedData.users.length > 0) {
        userData = scrapedData.users.map(user => ({
          username: user.username,
          profilePictureUrl: user.profile_image_url,
          bioText: user.description,
          followersCount: user.followers_count,
          verified: user.verified
        }));
      } else {
        userData = uniqueUsers.map(username => ({
          username,
          profilePictureUrl: null,
          bioText: null
        }));
      }

      demographicResults = await demographicAnalyzer.analyzeUsersDemographics(
        userData,
        async (progress, message) => {
          job.progress = Math.min(98, 95 + (progress * 0.03));
          await job.save();
        }
      );
    }

    // Step 4: Save results to database
    await saveAnalysisResults(postId, analyzedComments, demographicResults);

    // Update job status to completed
    job.status = 'completed';
    job.progress = 100;
    job.completed_at = new Date();
    await job.save();

    post.analysis_status = 'completed';
    await post.save();

    console.log(`Analysis job ${jobId} completed successfully`);

  } catch (error) {
    console.error(`Analysis job ${jobId} failed:`, error);
    
    try {
      const job = await AnalysisJob.findByPk(jobId);
      const post = await Post.findByPk(postId);
      
      if (job) {
        job.status = 'failed';
        job.error_message = error.message;
        await job.save();
      }
      
      if (post) {
        post.analysis_status = 'failed';
        post.error_message = error.message;
        await post.save();
      }
    } catch (updateError) {
      console.error('Failed to update job/post status:', updateError);
    }
  }
}

/**
 * Save analysis results to database
 */
async function saveAnalysisResults(postId, analyzedComments, demographicResults) {
  const { Comment, Demographics } = require('../models');

  // Save demographic data FIRST (comments reference demographics)
  for (const demoData of demographicResults) {
    try {
      await Demographics.upsert({
        username: demoData.username,
        predicted_age: demoData.predicted_age,
        age_confidence: demoData.age_confidence,
        predicted_gender: demoData.predicted_gender,
        gender_confidence: demoData.gender_confidence,
        predicted_location_country: demoData.predicted_location_country,
        predicted_location_state: demoData.predicted_location_state,
        predicted_location_city: demoData.predicted_location_city,
        location_confidence: demoData.location_confidence,
        profile_picture_url: demoData.profile_picture_url,
        bio_text: demoData.bio_text
      });
    } catch (error) {
      console.error('Error saving demographics for', demoData.username, ':', error.message);
    }
  }

  // Save comments with sentiment analysis
  for (const commentData of analyzedComments) {
    try {
      await Comment.create({
        post_id: postId,
        username: commentData.username,
        comment_text: commentData.text,
        timestamp: commentData.timestamp ? new Date(commentData.timestamp) : null,
        likes_count: commentData.likes || 0,
        reply_count: commentData.replyCount || 0,
        sentiment_primary: commentData.analysis.sentiment,
        sentiment_abuse: commentData.analysis.abuse_level,
        sentiment_emotion: commentData.analysis.emotion,
        confidence_score: commentData.analysis.confidence_score,
        reasoning: commentData.analysis.reasoning
      });
    } catch (error) {
      console.error('Error saving comment for', commentData.username, ':', error.message);
    }
  }
}

module.exports = router;

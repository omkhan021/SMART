const express = require('express');
const { Post, Comment, Demographics, AnalysisJob } = require('../models');
const SentimentAnalyzer = require('../services/sentimentAnalyzer');
const DemographicAnalyzer = require('../services/demographicAnalyzer');

const router = express.Router();
const sentimentAnalyzer = new SentimentAnalyzer();
const demographicAnalyzer = new DemographicAnalyzer();

/**
 * GET /api/results/:jobId
 * Get complete analysis results
 */
router.get('/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { page = 1, limit = 50, sentiment, emotion, abuse_level, gender, age_min, age_max } = req.query;

    // Get analysis job
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

    if (job.status !== 'completed') {
      return res.status(400).json({
        error: 'Analysis not completed yet',
        status: job.status,
        progress: job.progress
      });
    }

    // Build query filters
    const whereClause = { post_id: job.post_id };
    
    if (sentiment) whereClause.sentiment_primary = sentiment;
    if (emotion) whereClause.sentiment_emotion = emotion;
    if (abuse_level) whereClause.sentiment_abuse = abuse_level;

    // Get comments with pagination
    const offset = (page - 1) * limit;
    const comments = await Comment.findAndCountAll({
      where: whereClause,
      include: [{
        model: Demographics,
        as: 'demographics',
        where: {
          ...(gender && { predicted_gender: gender }),
          ...(age_min && { predicted_age: { [require('sequelize').Op.gte]: parseInt(age_min) } }),
          ...(age_max && { predicted_age: { [require('sequelize').Op.lte]: parseInt(age_max) } })
        },
        required: false
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Get all comments for statistics (without pagination)
    const allComments = await Comment.findAll({
      where: { post_id: job.post_id },
      include: [{
        model: Demographics,
        as: 'demographics',
        required: false
      }]
    });

    // Calculate statistics
    const sentimentStats = sentimentAnalyzer.getSentimentStatistics(
      allComments.map(c => ({
        analysis: {
          sentiment: c.sentiment_primary,
          abuse_level: c.sentiment_abuse,
          emotion: c.sentiment_emotion,
          confidence_score: c.confidence_score
        }
      }))
    );

    const uniqueUsers = [...new Set(allComments.map(c => c.username))];
    const userDemographics = await Demographics.findAll({
      where: { username: uniqueUsers }
    });

    const demographicStats = demographicAnalyzer.getDemographicStatistics(userDemographics);

    // Format response
    const response = {
      job: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        totalComments: job.total_comments,
        processedComments: job.processed_comments,
        startedAt: job.started_at,
        completedAt: job.completed_at
      },
      post: {
        id: job.post.id,
        platform: job.post.platform,
        original_url: job.post.original_url,
        post_author: job.post.post_author,
        post_content: job.post.post_content,
        total_comments: job.post.total_comments,
        analysis_timestamp: job.post.analysis_timestamp
      },
      comments: {
        data: comments.rows.map(comment => ({
          id: comment.id,
          username: comment.username,
          comment_text: comment.comment_text,
          timestamp: comment.timestamp,
          likes_count: comment.likes_count,
          reply_count: comment.reply_count,
          sentiment_primary: comment.sentiment_primary,
          sentiment_abuse: comment.sentiment_abuse,
          sentiment_emotion: comment.sentiment_emotion,
          confidence_score: comment.confidence_score,
          reasoning: comment.reasoning,
          demographics: comment.demographics ? {
            predicted_age: comment.demographics.predicted_age,
            age_confidence: comment.demographics.age_confidence,
            predicted_gender: comment.demographics.predicted_gender,
            gender_confidence: comment.demographics.gender_confidence,
            predicted_location_country: comment.demographics.predicted_location_country,
            predicted_location_state: comment.demographics.predicted_location_state,
            predicted_location_city: comment.demographics.predicted_location_city,
            location_confidence: comment.demographics.location_confidence
          } : null
        })),
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: comments.count,
          total_pages: Math.ceil(comments.count / limit)
        }
      },
      statistics: {
        sentiment: sentimentStats,
        demographics: demographicStats
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Results retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve results',
      message: error.message
    });
  }
});

/**
 * GET /api/results/:jobId/summary
 * Get analysis summary without detailed comments
 */
router.get('/:jobId/summary', async (req, res) => {
  try {
    const { jobId } = req.params;

    // Get analysis job
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

    if (job.status !== 'completed') {
      return res.status(400).json({
        error: 'Analysis not completed yet',
        status: job.status,
        progress: job.progress
      });
    }

    // Get all comments for statistics
    const allComments = await Comment.findAll({
      where: { post_id: job.post_id },
      include: [{
        model: Demographics,
        as: 'demographics',
        required: false
      }]
    });

    // Calculate statistics
    const sentimentStats = sentimentAnalyzer.getSentimentStatistics(
      allComments.map(c => ({
        analysis: {
          sentiment: c.sentiment_primary,
          abuse_level: c.sentiment_abuse,
          emotion: c.sentiment_emotion,
          confidence_score: c.confidence_score
        }
      }))
    );

    const uniqueUsers = [...new Set(allComments.map(c => c.username))];
    const userDemographics = await Demographics.findAll({
      where: { username: uniqueUsers }
    });

    const demographicStats = demographicAnalyzer.getDemographicStatistics(userDemographics);

    // Format response
    const response = {
      job: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        totalComments: job.total_comments,
        processedComments: job.processed_comments,
        startedAt: job.started_at,
        completedAt: job.completed_at
      },
      post: {
        id: job.post.id,
        platform: job.post.platform,
        original_url: job.post.original_url,
        post_author: job.post.post_author,
        post_content: job.post.post_content,
        total_comments: job.post.total_comments,
        analysis_timestamp: job.post.analysis_timestamp
      },
      statistics: {
        sentiment: sentimentStats,
        demographics: demographicStats
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Summary retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve summary',
      message: error.message
    });
  }
});

/**
 * GET /api/results/:jobId/comments
 * Get comments with advanced filtering
 */
router.get('/:jobId/comments', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { 
      page = 1, 
      limit = 50, 
      sentiment, 
      emotion, 
      abuse_level, 
      gender, 
      age_min, 
      age_max,
      search,
      sort_by = 'createdAt',
      sort_order = 'DESC'
    } = req.query;

    // Get analysis job
    const job = await AnalysisJob.findByPk(jobId);

    if (!job) {
      return res.status(404).json({
        error: 'Analysis job not found'
      });
    }

    if (job.status !== 'completed') {
      return res.status(400).json({
        error: 'Analysis not completed yet',
        status: job.status,
        progress: job.progress
      });
    }

    // Build query filters
    const whereClause = { post_id: job.post_id };
    
    if (sentiment) whereClause.sentiment_primary = sentiment;
    if (emotion) whereClause.sentiment_emotion = emotion;
    if (abuse_level) whereClause.sentiment_abuse = abuse_level;
    if (search) {
      whereClause.comment_text = {
        [require('sequelize').Op.iLike]: `%${search}%`
      };
    }

    // Build demographic filters
    const demographicWhere = {};
    if (gender) demographicWhere.predicted_gender = gender;
    if (age_min) demographicWhere.predicted_age = { [require('sequelize').Op.gte]: parseInt(age_min) };
    if (age_max) demographicWhere.predicted_age = { [require('sequelize').Op.lte]: parseInt(age_max) };

    // Get comments with pagination
    const offset = (page - 1) * limit;
    const comments = await Comment.findAndCountAll({
      where: whereClause,
      include: [{
        model: Demographics,
        as: 'demographics',
        where: Object.keys(demographicWhere).length > 0 ? demographicWhere : undefined,
        required: Object.keys(demographicWhere).length > 0
      }],
      order: [[sort_by, sort_order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Format response
    const response = {
      comments: {
        data: comments.rows.map(comment => ({
          id: comment.id,
          username: comment.username,
          comment_text: comment.comment_text,
          timestamp: comment.timestamp,
          likes_count: comment.likes_count,
          reply_count: comment.reply_count,
          sentiment_primary: comment.sentiment_primary,
          sentiment_abuse: comment.sentiment_abuse,
          sentiment_emotion: comment.sentiment_emotion,
          confidence_score: comment.confidence_score,
          reasoning: comment.reasoning,
          demographics: comment.demographics ? {
            predicted_age: comment.demographics.predicted_age,
            age_confidence: comment.demographics.age_confidence,
            predicted_gender: comment.demographics.predicted_gender,
            gender_confidence: comment.demographics.gender_confidence,
            predicted_location_country: comment.demographics.predicted_location_country,
            predicted_location_state: comment.demographics.predicted_location_state,
            predicted_location_city: comment.demographics.predicted_location_city,
            location_confidence: comment.demographics.location_confidence
          } : null
        })),
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: comments.count,
          total_pages: Math.ceil(comments.count / limit)
        }
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Comments retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve comments',
      message: error.message
    });
  }
});

module.exports = router;

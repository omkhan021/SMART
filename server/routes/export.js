const express = require('express');
const { Post, Comment, Demographics, AnalysisJob } = require('../models');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

const router = express.Router();

/**
 * GET /api/export/:jobId/csv
 * Export analysis results as CSV
 */
router.get('/:jobId/csv', async (req, res) => {
  try {
    const { jobId } = req.params;

    // Get analysis job and data
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
        error: 'Analysis not completed yet'
      });
    }

    // Get all comments with demographics
    const comments = await Comment.findAll({
      where: { post_id: job.post_id },
      include: [{
        model: Demographics,
        as: 'demographics',
        required: false
      }],
      order: [['createdAt', 'DESC']]
    });

    // Generate CSV
    const csvContent = generateCSV(comments, job.post);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="sentiment-analysis-${jobId}.csv"`);
    res.send(csvContent);

  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({
      error: 'Failed to export CSV',
      message: error.message
    });
  }
});

/**
 * GET /api/export/:jobId/excel
 * Export analysis results as Excel
 */
router.get('/:jobId/excel', async (req, res) => {
  try {
    const { jobId } = req.params;

    // Get analysis job and data
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
        error: 'Analysis not completed yet'
      });
    }

    // Get all comments with demographics
    const comments = await Comment.findAll({
      where: { post_id: job.post_id },
      include: [{
        model: Demographics,
        as: 'demographics',
        required: false
      }],
      order: [['createdAt', 'DESC']]
    });

    // Generate Excel workbook
    const workbook = await generateExcel(comments, job.post);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="sentiment-analysis-${jobId}.xlsx"`);
    
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).json({
      error: 'Failed to export Excel',
      message: error.message
    });
  }
});

/**
 * GET /api/export/:jobId/json
 * Export analysis results as JSON
 */
router.get('/:jobId/json', async (req, res) => {
  try {
    const { jobId } = req.params;

    // Get analysis job and data
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
        error: 'Analysis not completed yet'
      });
    }

    // Get all comments with demographics
    const comments = await Comment.findAll({
      where: { post_id: job.post_id },
      include: [{
        model: Demographics,
        as: 'demographics',
        required: false
      }],
      order: [['createdAt', 'DESC']]
    });

    // Format JSON response
    const jsonData = {
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
      comments: comments.map(comment => ({
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
      }))
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="sentiment-analysis-${jobId}.json"`);
    res.json(jsonData);

  } catch (error) {
    console.error('JSON export error:', error);
    res.status(500).json({
      error: 'Failed to export JSON',
      message: error.message
    });
  }
});

/**
 * GET /api/export/:jobId/pdf
 * Export analysis results as PDF report
 */
router.get('/:jobId/pdf', async (req, res) => {
  try {
    const { jobId } = req.params;

    // Get analysis job and data
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
        error: 'Analysis not completed yet'
      });
    }

    // Get all comments with demographics
    const comments = await Comment.findAll({
      where: { post_id: job.post_id },
      include: [{
        model: Demographics,
        as: 'demographics',
        required: false
      }],
      order: [['createdAt', 'DESC']]
    });

    // Generate PDF
    const pdfBuffer = await generatePDF(comments, job.post);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="sentiment-analysis-${jobId}.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({
      error: 'Failed to export PDF',
      message: error.message
    });
  }
});

/**
 * Generate CSV content
 */
function generateCSV(comments, post) {
  const headers = [
    'Username',
    'Comment Text',
    'Timestamp',
    'Likes Count',
    'Reply Count',
    'Sentiment',
    'Abuse Level',
    'Emotion',
    'Confidence Score',
    'Reasoning',
    'Predicted Age',
    'Age Confidence',
    'Predicted Gender',
    'Gender Confidence',
    'Predicted Country',
    'Predicted State',
    'Predicted City',
    'Location Confidence'
  ];

  const rows = comments.map(comment => [
    comment.username,
    `"${comment.comment_text.replace(/"/g, '""')}"`, // Escape quotes
    comment.timestamp ? new Date(comment.timestamp).toISOString() : '',
    comment.likes_count,
    comment.reply_count,
    comment.sentiment_primary,
    comment.sentiment_abuse,
    comment.sentiment_emotion,
    comment.confidence_score,
    `"${comment.reasoning ? comment.reasoning.replace(/"/g, '""') : ''}"`,
    comment.demographics?.predicted_age || '',
    comment.demographics?.age_confidence || '',
    comment.demographics?.predicted_gender || '',
    comment.demographics?.gender_confidence || '',
    comment.demographics?.predicted_location_country || '',
    comment.demographics?.predicted_location_state || '',
    comment.demographics?.predicted_location_city || '',
    comment.demographics?.location_confidence || ''
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

/**
 * Generate Excel workbook
 */
async function generateExcel(comments, post) {
  const workbook = new ExcelJS.Workbook();
  
  // Add metadata
  workbook.creator = 'Social Media Sentiment Analyzer';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Create main worksheet
  const worksheet = workbook.addWorksheet('Comments Analysis');
  
  // Define columns
  worksheet.columns = [
    { header: 'Username', key: 'username', width: 20 },
    { header: 'Comment Text', key: 'comment_text', width: 50 },
    { header: 'Timestamp', key: 'timestamp', width: 20 },
    { header: 'Likes Count', key: 'likes_count', width: 12 },
    { header: 'Reply Count', key: 'reply_count', width: 12 },
    { header: 'Sentiment', key: 'sentiment_primary', width: 12 },
    { header: 'Abuse Level', key: 'sentiment_abuse', width: 15 },
    { header: 'Emotion', key: 'sentiment_emotion', width: 12 },
    { header: 'Confidence Score', key: 'confidence_score', width: 15 },
    { header: 'Reasoning', key: 'reasoning', width: 30 },
    { header: 'Predicted Age', key: 'predicted_age', width: 12 },
    { header: 'Age Confidence', key: 'age_confidence', width: 15 },
    { header: 'Predicted Gender', key: 'predicted_gender', width: 15 },
    { header: 'Gender Confidence', key: 'gender_confidence', width: 18 },
    { header: 'Predicted Country', key: 'predicted_country', width: 15 },
    { header: 'Predicted State', key: 'predicted_state', width: 15 },
    { header: 'Predicted City', key: 'predicted_city', width: 15 },
    { header: 'Location Confidence', key: 'location_confidence', width: 18 }
  ];

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Add data rows
  comments.forEach(comment => {
    worksheet.addRow({
      username: comment.username,
      comment_text: comment.comment_text,
      timestamp: comment.timestamp ? new Date(comment.timestamp) : '',
      likes_count: comment.likes_count,
      reply_count: comment.reply_count,
      sentiment_primary: comment.sentiment_primary,
      sentiment_abuse: comment.sentiment_abuse,
      sentiment_emotion: comment.sentiment_emotion,
      confidence_score: comment.confidence_score,
      reasoning: comment.reasoning,
      predicted_age: comment.demographics?.predicted_age || '',
      age_confidence: comment.demographics?.age_confidence || '',
      predicted_gender: comment.demographics?.predicted_gender || '',
      gender_confidence: comment.demographics?.gender_confidence || '',
      predicted_country: comment.demographics?.predicted_location_country || '',
      predicted_state: comment.demographics?.predicted_location_state || '',
      predicted_city: comment.demographics?.predicted_location_city || '',
      location_confidence: comment.demographics?.location_confidence || ''
    });
  });

  // Auto-fit columns
  worksheet.columns.forEach(column => {
    column.width = Math.max(column.width || 10, 15);
  });

  return workbook;
}

/**
 * Generate PDF report
 */
async function generatePDF(comments, post) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });

    // Set up document
    doc.fontSize(20).text('Social Media Sentiment Analysis Report', 50, 50);
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 80);
    
    // Post information
    doc.fontSize(16).text('Post Information', 50, 120);
    doc.fontSize(10).text(`Platform: ${post.platform}`, 50, 140);
    doc.text(`Author: ${post.post_author || 'Unknown'}`, 50, 155);
    doc.text(`URL: ${post.original_url}`, 50, 170);
    doc.text(`Total Comments: ${post.total_comments}`, 50, 185);
    doc.text(`Analysis Date: ${new Date(post.analysis_timestamp).toLocaleDateString()}`, 50, 200);

    // Comments summary
    doc.fontSize(16).text('Comments Summary', 50, 240);
    
    let yPosition = 260;
    const commentsPerPage = 20;
    let commentCount = 0;

    comments.forEach((comment, index) => {
      if (commentCount >= commentsPerPage) {
        doc.addPage();
        yPosition = 50;
        commentCount = 0;
      }

      doc.fontSize(10).text(`${index + 1}. ${comment.username}`, 50, yPosition);
      doc.text(`   Sentiment: ${comment.sentiment_primary} (${comment.sentiment_emotion})`, 50, yPosition + 15);
      doc.text(`   Abuse Level: ${comment.sentiment_abuse}`, 50, yPosition + 30);
      doc.text(`   Confidence: ${(comment.confidence_score * 100).toFixed(1)}%`, 50, yPosition + 45);
      
      // Truncate long comments
      const truncatedComment = comment.comment_text.length > 100 
        ? comment.comment_text.substring(0, 100) + '...'
        : comment.comment_text;
      
      doc.text(`   Comment: ${truncatedComment}`, 50, yPosition + 60);
      
      yPosition += 90;
      commentCount++;
    });

    doc.end();
  });
}

module.exports = router;

const OpenAI = require('openai');
const config = require('../config');

class SentimentAnalyzer {
  constructor() {
    if (!config.openai.apiKey) {
      console.warn('⚠️  OpenAI API key not configured. Sentiment analysis will use fallback methods.');
      this.openai = null;
    } else {
      this.openai = new OpenAI({
        apiKey: config.openai.apiKey
      });
    }
  }

  /**
   * Analyze sentiment of a single comment
   * @param {string} commentText - The comment text to analyze
   * @returns {Object} - Analysis results
   */
  async analyzeComment(commentText) {
    try {
      // Fallback to simple keyword-based analysis if OpenAI is not available
      if (!this.openai) {
        return this.fallbackAnalysis(commentText);
      }

      const prompt = `You are an expert sentiment analyst. Analyze the following social media comment and return ONLY a JSON object with these fields:
- sentiment: (positive/negative/neutral)
- abuse_level: (safe/profanity/toxic/hate_speech/harassment)
- emotion: (joy/anger/sadness/fear/surprise/disgust)
- confidence_score: (0.0 to 1.0)
- reasoning: (brief explanation)

Comment: ${commentText}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a professional sentiment analysis expert. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 300
      });

      const analysisText = response.choices[0].message.content.trim();
      
      // Parse JSON response
      let analysis;
      try {
        analysis = JSON.parse(analysisText);
      } catch (parseError) {
        // If JSON parsing fails, try to extract JSON from the response
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Failed to parse analysis response as JSON');
        }
      }

      // Validate and normalize the response
      return this.validateAndNormalizeAnalysis(analysis);

    } catch (error) {
      console.error('Sentiment analysis error:', error);
      return this.fallbackAnalysis(commentText);
    }
  }

  /**
   * Fallback sentiment analysis using keyword matching
   * @param {string} commentText - The comment text to analyze
   * @returns {Object} - Analysis results
   */
  fallbackAnalysis(commentText) {
    // Handle undefined or null comment text
    if (!commentText || typeof commentText !== 'string') {
      console.warn('⚠️ Invalid comment text provided to fallbackAnalysis:', commentText);
      return {
        sentiment: 'neutral',
        abuse_level: 'safe',
        emotion: 'neutral',
        confidence_score: 0.5,
        reasoning: 'Fallback analysis - invalid comment text'
      };
    }
    
    const text = commentText.toLowerCase();
    
    // Simple keyword-based sentiment analysis
    const positiveWords = ['good', 'great', 'awesome', 'amazing', 'love', 'like', 'happy', 'excellent', 'fantastic', 'wonderful', 'best', 'perfect'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'sad', 'angry', 'horrible', 'worst', 'disgusting', 'stupid', 'dumb'];
    
    const positiveCount = positiveWords.filter(word => text.includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.includes(word)).length;
    
    let sentiment = 'neutral';
    let confidence = 0.5;
    let emotion = 'joy';
    
    if (positiveCount > negativeCount) {
      sentiment = 'positive';
      confidence = Math.min(0.8, 0.5 + (positiveCount * 0.1));
      emotion = 'joy';
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative';
      confidence = Math.min(0.8, 0.5 + (negativeCount * 0.1));
      emotion = 'anger';
    }
    
    return {
      sentiment,
      abuse_level: 'safe',
      emotion,
      confidence_score: confidence,
      reasoning: 'Fallback keyword-based analysis (OpenAI not configured)'
    };
  }

  /**
   * Analyze multiple comments in batch
   * @param {Array} comments - Array of comment texts
   * @param {Function} progressCallback - Progress callback function
   * @returns {Array} - Array of analysis results
   */
  async analyzeCommentsBatch(comments, progressCallback = () => {}) {
    const results = [];
    const batchSize = 10; // Process 10 comments at a time to avoid rate limits
    
    for (let i = 0; i < comments.length; i += batchSize) {
      const batch = comments.slice(i, i + batchSize);
      const batchPromises = batch.map(async (comment, index) => {
        try {
          const analysis = await this.analyzeComment(comment.text);
          return {
            ...comment,
            analysis
          };
        } catch (error) {
          console.error(`Error analyzing comment ${i + index}:`, error);
          return {
            ...comment,
            analysis: {
              sentiment: 'neutral',
              abuse_level: 'safe',
              emotion: 'joy',
              confidence_score: 0.5,
              reasoning: 'Analysis failed'
            }
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Update progress
      const progress = Math.round(((i + batchSize) / comments.length) * 100);
      progressCallback(progress, `Analyzed ${Math.min(i + batchSize, comments.length)} of ${comments.length} comments`);

      // Add delay between batches to respect rate limits
      if (i + batchSize < comments.length) {
        await this.delay(1000);
      }
    }

    return results;
  }

  /**
   * Validate and normalize analysis results
   * @param {Object} analysis - Raw analysis result
   * @returns {Object} - Validated and normalized result
   */
  validateAndNormalizeAnalysis(analysis) {
    const validSentiments = ['positive', 'negative', 'neutral'];
    const validAbuseLevels = ['safe', 'profanity', 'toxic', 'hate_speech', 'harassment'];
    const validEmotions = ['joy', 'anger', 'sadness', 'fear', 'surprise', 'disgust'];

    return {
      sentiment: validSentiments.includes(analysis.sentiment?.toLowerCase()) 
        ? analysis.sentiment.toLowerCase() 
        : 'neutral',
      abuse_level: validAbuseLevels.includes(analysis.abuse_level?.toLowerCase()) 
        ? analysis.abuse_level.toLowerCase() 
        : 'safe',
      emotion: validEmotions.includes(analysis.emotion?.toLowerCase()) 
        ? analysis.emotion.toLowerCase() 
        : 'joy',
      confidence_score: typeof analysis.confidence_score === 'number' 
        ? Math.max(0, Math.min(1, analysis.confidence_score)) 
        : 0.5,
      reasoning: typeof analysis.reasoning === 'string' 
        ? analysis.reasoning.substring(0, 500) // Limit reasoning length
        : 'No reasoning provided'
    };
  }

  /**
   * Get sentiment statistics from analyzed comments
   * @param {Array} analyzedComments - Array of comments with analysis
   * @returns {Object} - Sentiment statistics
   */
  getSentimentStatistics(analyzedComments) {
    const stats = {
      total: analyzedComments.length,
      sentiment: {
        positive: 0,
        negative: 0,
        neutral: 0
      },
      abuse: {
        safe: 0,
        profanity: 0,
        toxic: 0,
        hate_speech: 0,
        harassment: 0
      },
      emotion: {
        joy: 0,
        anger: 0,
        sadness: 0,
        fear: 0,
        surprise: 0,
        disgust: 0
      },
      averageConfidence: 0
    };

    let totalConfidence = 0;

    analyzedComments.forEach(comment => {
      const analysis = comment.analysis;
      
      // Count sentiments
      stats.sentiment[analysis.sentiment]++;
      
      // Count abuse levels
      stats.abuse[analysis.abuse_level]++;
      
      // Count emotions
      stats.emotion[analysis.emotion]++;
      
      // Sum confidence scores
      totalConfidence += analysis.confidence_score;
    });

    // Calculate average confidence
    stats.averageConfidence = stats.total > 0 ? totalConfidence / stats.total : 0;

    // Calculate percentages
    stats.sentimentPercentages = {
      positive: (stats.sentiment.positive / stats.total) * 100,
      negative: (stats.sentiment.negative / stats.total) * 100,
      neutral: (stats.sentiment.neutral / stats.total) * 100
    };

    stats.abusePercentages = {
      safe: (stats.abuse.safe / stats.total) * 100,
      profanity: (stats.abuse.profanity / stats.total) * 100,
      toxic: (stats.abuse.toxic / stats.total) * 100,
      hate_speech: (stats.abuse.hate_speech / stats.total) * 100,
      harassment: (stats.abuse.harassment / stats.total) * 100
    };

    stats.emotionPercentages = {
      joy: (stats.emotion.joy / stats.total) * 100,
      anger: (stats.emotion.anger / stats.total) * 100,
      sadness: (stats.emotion.sadness / stats.total) * 100,
      fear: (stats.emotion.fear / stats.total) * 100,
      surprise: (stats.emotion.surprise / stats.total) * 100,
      disgust: (stats.emotion.disgust / stats.total) * 100
    };

    return stats;
  }

  /**
   * Utility function to add delay
   * @param {number} ms - Milliseconds to delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = SentimentAnalyzer;

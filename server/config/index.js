require('dotenv').config();

const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 5000,
    environment: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
  },

  // Database Configuration
  database: {
    dialect: 'sqlite',
    storage: process.env.DATABASE_PATH || './database.sqlite',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: false
    }
  },

  // Twitter API Configuration
  twitter: {
    apiKey: process.env.TWITTER_API_KEY,
    apiSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    bearerToken: process.env.TWITTER_BEARER_TOKEN,
    clientId: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET
  },

  // Rate Limiting Configuration
    rateLimits: {
      twitter: {
        tweets: {
          limit: parseInt(process.env.TWITTER_RATE_LIMIT_TWEETS) || 300, // Free tier allows 300 per 15 minutes
          windowMs: parseInt(process.env.TWITTER_RATE_WINDOW_MS) || (15 * 60 * 1000) // 15 minutes
        },
        users: {
          limit: parseInt(process.env.TWITTER_RATE_LIMIT_USERS) || 300, // Free tier allows 300 per 15 minutes
          windowMs: parseInt(process.env.TWITTER_RATE_WINDOW_MS) || (15 * 60 * 1000)
        },
        search: {
          limit: parseInt(process.env.TWITTER_RATE_LIMIT_SEARCH) || 75, // Free tier allows 75 per 15 minutes
          windowMs: parseInt(process.env.TWITTER_RATE_WINDOW_MS) || (15 * 60 * 1000)
        }
      }
    },

  // OpenAI Configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY
  },

  // Analysis Configuration
  analysis: {
    maxCommentsPerAnalysis: parseInt(process.env.MAX_COMMENTS_PER_ANALYSIS) || 100,
    defaultMockMode: process.env.DEFAULT_MOCK_MODE === 'true' || false
  }
};

// Validation function to check if required environment variables are set
const validateConfig = () => {
  const requiredVars = [
    'TWITTER_API_KEY',
    'TWITTER_API_SECRET', 
    'TWITTER_ACCESS_TOKEN',
    'TWITTER_ACCESS_TOKEN_SECRET',
    'TWITTER_BEARER_TOKEN'
  ];

  const optionalVars = [
    'OPENAI_API_KEY'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn('⚠️  Missing required environment variables:', missingVars.join(', '));
    console.warn('📝 Please check your .env file or set these variables in your environment');
    console.warn('🔧 The application will use default values, but Twitter API features may not work properly');
  } else {
    console.log('✅ All required environment variables are set');
  }

  // Check optional variables
  const missingOptionalVars = optionalVars.filter(varName => !process.env[varName]);
  if (missingOptionalVars.length > 0) {
    console.warn('⚠️  Missing optional environment variables:', missingOptionalVars.join(', '));
    console.warn('📝 These are optional but may be needed for full functionality');
  }
};

// Validate configuration on load
validateConfig();

module.exports = config;

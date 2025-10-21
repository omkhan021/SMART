const { Sequelize, DataTypes } = require('sequelize');

// Database configuration
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DATABASE_URL || './database.sqlite',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true
  }
});

// Post model
const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  platform: {
    type: DataTypes.ENUM('instagram', 'threads', 'facebook', 'twitter', 'truth_social', 'tiktok'),
    allowNull: false
  },
  original_url: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true
  },
  post_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  post_author: {
    type: DataTypes.STRING,
    allowNull: true
  },
  post_content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  total_comments: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  analysis_status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
    defaultValue: 'pending'
  },
  analysis_timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

// Comment model
const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  post_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Post,
      key: 'id'
    }
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false
  },
  comment_text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: true
  },
  likes_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  reply_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  sentiment_primary: {
    type: DataTypes.ENUM('positive', 'negative', 'neutral'),
    allowNull: true
  },
  sentiment_abuse: {
    type: DataTypes.ENUM('safe', 'profanity', 'toxic', 'hate_speech', 'harassment'),
    allowNull: true
  },
  sentiment_emotion: {
    type: DataTypes.ENUM('joy', 'anger', 'sadness', 'fear', 'surprise', 'disgust'),
    allowNull: true
  },
  confidence_score: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      min: 0.0,
      max: 1.0
    }
  },
  reasoning: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  analysis_timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

// Demographics model
const Demographics = sequelize.define('Demographics', {
  username: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  predicted_age: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 13,
      max: 100
    }
  },
  age_confidence: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      min: 0.0,
      max: 1.0
    }
  },
  predicted_gender: {
    type: DataTypes.ENUM('male', 'female', 'non-binary', 'unknown'),
    allowNull: true
  },
  gender_confidence: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      min: 0.0,
      max: 1.0
    }
  },
  predicted_location_country: {
    type: DataTypes.STRING,
    allowNull: true
  },
  predicted_location_state: {
    type: DataTypes.STRING,
    allowNull: true
  },
  predicted_location_city: {
    type: DataTypes.STRING,
    allowNull: true
  },
  location_confidence: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      min: 0.0,
      max: 1.0
    }
  },
  profile_picture_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  bio_text: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  analysis_timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

// Analysis Job model for tracking background processing
const AnalysisJob = sequelize.define('AnalysisJob', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  post_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Post,
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'scraping', 'analyzing', 'completed', 'failed'),
    defaultValue: 'pending'
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  total_comments: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  processed_comments: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  started_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
});

// Define associations
Post.hasMany(Comment, { foreignKey: 'post_id', as: 'comments' });
Comment.belongsTo(Post, { foreignKey: 'post_id', as: 'post' });

Post.hasMany(AnalysisJob, { foreignKey: 'post_id', as: 'jobs' });
AnalysisJob.belongsTo(Post, { foreignKey: 'post_id', as: 'post' });

Comment.belongsTo(Demographics, { foreignKey: 'username', targetKey: 'username', as: 'demographics' });
Demographics.hasMany(Comment, { foreignKey: 'username', sourceKey: 'username', as: 'comments' });

module.exports = {
  sequelize,
  Post,
  Comment,
  Demographics,
  AnalysisJob
};

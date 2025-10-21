# Social Media Sentiment Analyzer

A comprehensive full-stack web application that analyzes sentiment and demographics from social media post comments across multiple platforms including Instagram, Threads, Facebook, Twitter (X), Truth Social, and TikTok.

## Features

### 🎯 Core Functionality
- **Multi-Platform Support**: Analyze posts from Instagram, Threads, Facebook, Twitter, Truth Social, and TikTok
- **Real-time Analysis**: Background processing with progress tracking
- **Advanced Sentiment Analysis**: Positive/Negative/Neutral classification with emotion detection
- **Demographic Inference**: Age, gender, and location prediction from usernames and profiles
- **Abuse Detection**: Identify toxic content, hate speech, and harassment

### 📊 Analytics & Visualization
- **Interactive Dashboard**: Comprehensive results with multiple chart types
- **Sentiment Distribution**: Pie charts and bar charts for sentiment analysis
- **Demographic Breakdown**: Age distribution, gender analysis, and geographic mapping
- **Trend Analysis**: Sentiment changes over time
- **Word Clouds**: Most frequent words in positive vs negative comments

### 📤 Export Capabilities
- **Multiple Formats**: CSV, Excel, JSON, and PDF exports
- **Filtered Exports**: Export filtered results based on criteria
- **Detailed Reports**: Comprehensive analysis reports with visualizations

## Technology Stack

### Backend
- **Node.js** with Express.js
- **SQLite** database with Sequelize ORM
- **Puppeteer** for web scraping
- **OpenAI GPT-4** for sentiment analysis
- **External APIs**: Agify.io, Genderize.io, Hive AI for demographics

### Frontend
- **Next.js 14** with TypeScript
- **React Redux Toolkit** for state management
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **React Leaflet** for geographic mapping

## Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- OpenAI API key
- Optional: Agify.io, Genderize.io, Hive AI API keys

### 1. Clone the Repository
```bash
git clone <repository-url>
cd social-media-sentiment-analyzer
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install all dependencies (root, server, client)
npm run install:all
```

### 3. Environment Configuration

#### Backend (.env)
```bash
cd server
cp .env.example .env
```

Edit `server/.env` with your configuration:
```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# Database
DATABASE_URL=./database.sqlite

# API Keys
OPENAI_API_KEY=your_openai_api_key_here
AGIFY_API_KEY=your_agify_api_key_here
GENDERIZE_API_KEY=your_genderize_api_key_here
HIVE_API_KEY=your_hive_api_key_here
```

#### Frontend (.env.local)
```bash
cd client
```

Create `client/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 4. Run the Application

#### Development Mode (Both Frontend and Backend)
```bash
npm run dev
```

#### Individual Services
```bash
# Backend only
npm run server:dev

# Frontend only  
npm run client:dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Usage

### 1. Start Analysis
1. Navigate to the application homepage
2. Paste a social media post URL from any supported platform
3. Click "Analyze Post" to start the analysis
4. Monitor progress in real-time

### 2. View Results
- **Overview Tab**: Summary statistics and key metrics
- **Comments Tab**: Detailed comment analysis with filtering
- **Demographics Tab**: User demographic breakdown and geographic analysis

### 3. Export Data
- Click the export button to download results
- Choose from CSV, Excel, JSON, or PDF formats
- Apply filters before exporting for targeted data

## Supported Platforms

| Platform | URL Format | Status |
|----------|------------|--------|
| Instagram | `instagram.com/p/[post-id]` | ✅ Supported |
| Threads | `threads.net/@[username]/post/[post-id]` | ✅ Supported |
| Facebook | `facebook.com/[user]/posts/[post-id]` | ✅ Supported |
| Twitter/X | `twitter.com/[user]/status/[status-id]` | ✅ Supported |
| Truth Social | `truthsocial.com/@[username]/posts/[post-id]` | ✅ Supported |
| TikTok | `tiktok.com/@[username]/video/[video-id]` | ✅ Supported |

## API Endpoints

### Analysis
- `POST /api/analyze` - Start new analysis
- `GET /api/analyze/status/:jobId` - Check analysis status
- `GET /api/results/:jobId` - Get complete results
- `GET /api/results/:jobId/summary` - Get summary only
- `GET /api/results/:jobId/comments` - Get filtered comments

### Export
- `GET /api/export/:jobId/csv` - Export as CSV
- `GET /api/export/:jobId/excel` - Export as Excel
- `GET /api/export/:jobId/json` - Export as JSON
- `GET /api/export/:jobId/pdf` - Export as PDF

## Architecture

### Database Schema
- **Posts**: Store post metadata and analysis status
- **Comments**: Store individual comments with sentiment analysis
- **Demographics**: Store user demographic predictions
- **AnalysisJobs**: Track background processing jobs

### Processing Pipeline
1. **URL Validation**: Parse and validate social media URLs
2. **Web Scraping**: Extract comments using Puppeteer
3. **Sentiment Analysis**: Process comments with OpenAI GPT-4
4. **Demographic Analysis**: Predict user demographics
5. **Data Storage**: Save results to database
6. **Real-time Updates**: Provide progress updates to frontend

## Legal & Ethical Considerations

- **Terms of Service**: Tool is for research/analysis purposes only
- **Rate Limiting**: Implemented to prevent abuse
- **Privacy Notice**: Only processes publicly visible data
- **Platform Compliance**: Respects robots.txt and terms of service
- **Data Retention**: No storage of personally identifiable information beyond public visibility

## Performance Optimization

- **Batch Processing**: Comments processed in batches of 10-50
- **Background Jobs**: Queue-based processing with Bull/BullMQ
- **Caching**: API responses cached for 24 hours
- **Pagination**: Large result sets paginated for performance
- **Rate Limiting**: Exponential backoff for API calls

## Error Handling

- **Graceful Degradation**: Partial results if some comments fail
- **Retry Logic**: Automatic retry with exponential backoff
- **User Feedback**: Clear error messages and recovery options
- **Logging**: Comprehensive error logging for debugging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue in the repository
- Check the documentation
- Review the API documentation

---

**Note**: This tool is designed for research and analysis purposes. Please ensure compliance with platform terms of service and applicable laws when using this application.

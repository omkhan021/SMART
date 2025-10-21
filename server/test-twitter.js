const { TwitterApi } = require('twitter-api-v2');

// Test Twitter API connection
async function testTwitterAPI() {
  try {
    console.log('🧪 Testing Twitter API connection...');
    
    const client = new TwitterApi({
      appKey: 'yNmKWFGA9y66L9yAAJ4oB4Hgf',
      appSecret: 'GQQgdK9kNdBCCyC9ESAAZ9bNmRO9oX36bl3ZpfAsUEfe8kGX8E',
      accessToken: '1682803693-prsovYjUdGYkso6ExL55ylflB4c9yl2MzfswG47',
      accessTokenSecret: 'djrvFY8F0MkPbVy1wyBazFj8IUuOCCenBghV1jQRR5hXp',
    });

    // Test 1: Get a simple tweet
    console.log('📝 Test 1: Getting a simple tweet...');
    const tweet = await client.v2.singleTweet('1234567890', {
      'tweet.fields': ['id', 'text', 'author_id', 'created_at']
    });
    
    console.log('✅ Tweet API working:', tweet.data?.text || 'No text');
    console.log('📊 Rate limit headers:', {
      remaining: tweet._headers['x-rate-limit-remaining'],
      reset: tweet._headers['x-rate-limit-reset'],
      limit: tweet._headers['x-rate-limit-limit']
    });

    // Test 2: Try search (this is where we're likely hitting limits)
    console.log('\n🔍 Test 2: Testing search API...');
    try {
      const search = await client.v2.search('hello', {
        'tweet.fields': ['id', 'text'],
        'max_results': 10
      });
      
      console.log('✅ Search API working:', search.data?.data?.length || 0, 'results');
      console.log('📊 Search rate limit headers:', {
        remaining: search._headers['x-rate-limit-remaining'],
        reset: search._headers['x-rate-limit-reset'],
        limit: search._headers['x-rate-limit-limit']
      });
    } catch (searchError) {
      console.log('❌ Search API failed:', searchError.message);
      console.log('📊 Search error details:', {
        code: searchError.code,
        status: searchError.status
      });
    }

  } catch (error) {
    console.error('❌ Twitter API test failed:', error.message);
    console.error('Error details:', {
      code: error.code,
      status: error.status,
      headers: error.headers
    });
  }
}

testTwitterAPI();

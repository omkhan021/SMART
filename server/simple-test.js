const { TwitterApi } = require('twitter-api-v2');

async function simpleTest() {
  try {
    console.log('🧪 Simple Twitter API test...');
    
    const bearerToken = 'AAAAAAAAAAAAAAAAAAAAAOo%2F0wEAAAAA5COObfxxfRPV19ZwCLyzrufqpJ4%3D4LJrnhgrvMKU8uThD8sUeHbShTPH2EzOJpygRMWadUweWJj136';
    const client = new TwitterApi(bearerToken);

    // Test with a simple tweet lookup
    console.log('📝 Getting tweet...');
    const tweet = await client.v2.singleTweet('1234567890', {
      'tweet.fields': ['id', 'text', 'author_id', 'created_at', 'public_metrics'],
      'user.fields': ['id', 'username', 'name'],
      'expansions': ['author_id']
    });
    
    console.log('✅ Success!');
    console.log('Tweet:', tweet.data.text);
    console.log('Author:', tweet.includes?.users?.[0]?.username);
    console.log('Likes:', tweet.data.public_metrics?.like_count);
    
    // Format data like our service does
    const formattedData = {
      post: {
        id: tweet.data.id,
        author: tweet.includes?.users?.[0]?.username || 'unknown',
        content: tweet.data.text,
        platform: 'twitter',
        total_comments: 0, // No replies for now
        likes_count: tweet.data.public_metrics?.like_count || 0,
        retweets_count: tweet.data.public_metrics?.retweet_count || 0,
        created_at: tweet.data.created_at
      },
      comments: [], // Empty for now
      users: tweet.includes?.users?.map(user => ({
        username: user.username,
        name: user.name,
        id: user.id
      })) || [],
      totalComments: 0
    };
    
    console.log('📊 Formatted data:', JSON.stringify(formattedData, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.data) {
      console.error('Error details:', error.data);
    }
  }
}

simpleTest();

import axios from 'axios';

// Set up axios with credentials
const api = axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: true
});

// Test user credentials
const adminCredentials = {
  username: 'admin@elevion.dev',
  password: '*Rosie2010'
};

// Sample website metrics for testing
const sampleMetrics = [
  {
    url: 'https://client1-example.com',
    page_load_time: 2.45,
    ttfb: 0.78,
    fcp: 1.2,
    lcp: 2.9,
    cls: 0.05,
    bounce_rate: 35.5,
    device_type: 'desktop',
    browser: 'Chrome'
  },
  {
    url: 'https://client1-example.com/about',
    page_load_time: 1.95,
    ttfb: 0.65,
    fcp: 0.9,
    lcp: 2.1,
    cls: 0.02,
    bounce_rate: 28.7,
    device_type: 'desktop',
    browser: 'Firefox'
  },
  {
    url: 'https://client1-example.com/products',
    page_load_time: 3.12,
    ttfb: 0.92,
    fcp: 1.6,
    lcp: 3.5,
    cls: 0.08,
    bounce_rate: 42.3,
    device_type: 'mobile',
    browser: 'Safari'
  }
];

// Authentication function using our special test endpoint
async function login() {
  try {
    // Use the test-auth endpoint which is specifically designed for testing
    const response = await api.post('/api/analytics/test-auth', {
      username: 'test_admin',
      password: 'Password123!'
    });
    
    if (response.status === 200 && response.data.success) {
      console.log('✓ Test authentication successful');
      
      // Set the token in the Authorization header
      if (response.data.token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        console.log('✓ Token set in Authorization header');
      }
      
      // Return the user ID from the response
      const userId = response.data.user?.id || 1;
      console.log(`✓ Using user ID: ${userId}`);
      return userId;
    } else {
      console.error('× Authentication failed:', response.data.message || 'Unknown error');
      return 1; // Fallback to user ID 1
    }
  } catch (error) {
    console.error('× Authentication error:', error.message);
    if (error.response) {
      console.error('× Error response:', error.response.data);
    }
    return 1; // Fallback to user ID 1
  }
}

// Test adding website metrics
async function testAddWebsiteMetrics(clientId) {
  console.log('\n---- Testing POST /api/analytics/website-performance ----');
  
  for (const metric of sampleMetrics) {
    try {
      const metricWithClientId = { ...metric, clientId };
      const response = await api.post('/api/analytics/website-performance', metricWithClientId);
      console.log(`✓ Added metric for ${metric.url} - Response:`, response.status, response.data.success);
    } catch (error) {
      console.error(`✗ Failed to add metric for ${metric.url}:`, error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
    }
  }
}

// Test retrieving website metrics
async function testGetWebsiteMetrics(clientId) {
  console.log('\n---- Testing GET /api/analytics/website-performance/:clientId ----');
  
  try {
    const response = await api.get(`/api/analytics/website-performance/${clientId}`);
    console.log(`✓ Retrieved website metrics - Status:`, response.status);
    
    // Log a summary of the response
    const { metrics_count, averages, breakdowns, analysis } = response.data;
    console.log(`\nMetrics Summary:`);
    console.log(`- Total metrics: ${metrics_count}`);
    console.log(`- Average page load time: ${averages.page_load_time}s`);
    console.log(`- Average TTFB: ${averages.ttfb}s`);
    
    // Device breakdown
    console.log(`\nDevice Breakdown:`);
    for (const [device, count] of Object.entries(breakdowns.by_device)) {
      console.log(`- ${device}: ${count}`);
    }
    
    // Browser breakdown
    console.log(`\nBrowser Breakdown:`);
    for (const [browser, count] of Object.entries(breakdowns.by_browser)) {
      console.log(`- ${browser}: ${count}`);
    }
    
    // Log a portion of the AI analysis
    console.log(`\nAI Analysis Summary (excerpt):`);
    const analysisExcerpt = analysis.length > 300 
      ? analysis.substring(0, 300) + '...' 
      : analysis;
    console.log(analysisExcerpt);
    
  } catch (error) {
    console.error('✗ Failed to retrieve website metrics:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Main test function
async function runTests() {
  console.log('Starting website performance metrics API tests...');
  
  try {
    // Login to get authentication cookie
    const userId = await login();
    
    // Use the logged-in user ID as the client ID for metrics
    const clientId = userId;
    console.log(`Using client ID: ${clientId}`);
    
    // Run tests
    await testAddWebsiteMetrics(clientId);
    await testGetWebsiteMetrics(clientId);
    
    console.log('\nTests completed!');
  } catch (error) {
    console.error('Test execution error:', error);
  }
}

// Run the tests
runTests();
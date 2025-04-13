#!/usr/bin/env node

// Using the built-in fetch API in Node.js
async function testBlogContentEndpoint() {
  try {
    console.log('Testing /api/mockups/suggest-blog-content endpoint...');
    
    const response = await fetch('http://localhost:3000/api/mockups/suggest-blog-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessType: 'fitness studio',
        targetAudience: 'health-conscious adults aged 25-45',
        contentLength: 'medium',
        topics: 'workout routines, nutrition, mindfulness'
      })
    });
    
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('SUCCESS: Blog content suggestions generated successfully!');
      console.log('Source:', data.source);
      console.log('First few lines of content:');
      const firstFewLines = data.blogContentSuggestions.split('\n').slice(0, 5).join('\n');
      console.log(firstFewLines);
    } else {
      console.log('ERROR: Failed to generate blog content suggestions');
      console.log('Error message:', data.message);
    }
  } catch (error) {
    console.error('Error testing endpoint:', error);
  }
}

testBlogContentEndpoint();
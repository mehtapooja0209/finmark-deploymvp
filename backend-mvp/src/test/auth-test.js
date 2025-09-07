// Simple authentication test script
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

// Test configuration
const API_URL = 'http://localhost:3000';
const TEST_ENDPOINTS = [
  { url: '/api/health', requiresAuth: false, description: 'Health check endpoint' },
  { url: '/api/documents', requiresAuth: true, description: 'Documents list endpoint' },
  { url: '/api/admin/users', requiresAuth: true, adminOnly: true, description: 'Admin users endpoint' }
];

// Test with no token
async function testNoAuth() {
  console.log('\n--- Testing without authentication ---');
  
  for (const endpoint of TEST_ENDPOINTS) {
    try {
      const response = await axios.get(`${API_URL}${endpoint.url}`);
      console.log(`✅ ${endpoint.description}: ${response.status} ${response.statusText}`);
      
      if (endpoint.requiresAuth) {
        console.log(`❌ ERROR: ${endpoint.url} should require authentication but allowed access`);
      }
    } catch (error) {
      const status = error.response?.status || 'Unknown';
      
      if (endpoint.requiresAuth && status === 401) {
        console.log(`✅ ${endpoint.description}: Correctly rejected unauthenticated request (${status})`);
      } else if (!endpoint.requiresAuth) {
        console.log(`❌ ${endpoint.description}: Failed with status ${status} but should be accessible`);
      } else {
        console.log(`❓ ${endpoint.description}: Failed with status ${status}`);
      }
    }
  }
}

// Test with invalid token
async function testInvalidAuth() {
  console.log('\n--- Testing with invalid token ---');
  
  const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  
  for (const endpoint of TEST_ENDPOINTS) {
    if (!endpoint.requiresAuth) continue;
    
    try {
      const response = await axios.get(`${API_URL}${endpoint.url}`, {
        headers: { Authorization: `Bearer ${invalidToken}` }
      });
      
      console.log(`❌ ${endpoint.description}: Accepted invalid token (${response.status})`);
    } catch (error) {
      const status = error.response?.status || 'Unknown';
      
      if (status === 401) {
        console.log(`✅ ${endpoint.description}: Correctly rejected invalid token (${status})`);
      } else {
        console.log(`❓ ${endpoint.description}: Failed with status ${status}`);
      }
    }
  }
}

// Run tests
async function runTests() {
  try {
    // Test health endpoint to make sure server is running
    await axios.get(`${API_URL}/api/health`);
    console.log('Server is running. Starting authentication tests...');
    
    await testNoAuth();
    await testInvalidAuth();
    
    console.log('\nAuthentication tests completed.');
  } catch (error) {
    console.error('Error: Server not running or health endpoint not available');
    console.error(error.message);
  }
}

runTests();

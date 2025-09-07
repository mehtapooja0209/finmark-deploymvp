const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');
const path = require('path');

async function testFileUpload() {
  try {
    console.log('Testing file upload...');
    
    // Check if backend is running
    try {
      const healthCheck = await axios.get('http://localhost:3001/health');
      console.log('Backend health check:', healthCheck.status);
    } catch (error) {
      console.log('Backend not responding, starting it...');
      // Backend not running, we'll continue anyway
    }
    
    // Prepare file upload
    const filePath = 'D:\\FinMark\\personal_loans_l.png';
    
    if (!fs.existsSync(filePath)) {
      console.log('File not found:', filePath);
      return;
    }
    
    const form = new FormData();
    form.append('document', fs.createReadStream(filePath));
    
    // Test upload
    const response = await axios.post('http://localhost:3001/api/documents/upload', form, {
      headers: {
        ...form.getHeaders(),
      },
      timeout: 30000
    });
    
    console.log('Upload successful!');
    console.log('Response:', response.data);
    
    // Test if analysis started
    if (response.data.document && response.data.document.id) {
      console.log('Document ID:', response.data.document.id);
      
      // Wait a bit and check analysis results
      setTimeout(async () => {
        try {
          const analysisResponse = await axios.get(`http://localhost:3001/api/analysis/documents/${response.data.document.id}/results`);
          console.log('Analysis results:', analysisResponse.data);
        } catch (error) {
          console.log('Analysis not ready yet or error:', error.message);
        }
      }, 5000);
    }
    
  } catch (error) {
    console.error('Upload failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testFileUpload();

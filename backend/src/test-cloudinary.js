import dotenv from 'dotenv';
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

// Setup cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.SECRET_KEY_CLOUD,
});

// Test function
async function testCloudinaryConnection() {
  console.log('Testing Cloudinary connection...');
  console.log('Environment variables:');
  console.log('- CLOUD_NAME:', process.env.CLOUD_NAME);
  console.log('- API_KEY:', process.env.API_KEY ? '✓ Set' : '✗ Missing');
  console.log('- SECRET_KEY_CLOUD:', process.env.SECRET_KEY_CLOUD ? '✓ Set' : '✗ Missing');
  
  try {
    // Ping Cloudinary to check connectivity
    const result = await cloudinary.api.ping();
    console.log('Cloudinary ping successful!');
    console.log('Status:', result.status);
    return true;
  } catch (error) {
    console.error('Cloudinary connection test failed:');
    console.error(error);
    return false;
  }
}

// Run the test
testCloudinaryConnection()
  .then(success => {
    if (success) {
      console.log('✅ Cloudinary is properly configured!');
    } else {
      console.log('❌ Cloudinary configuration has issues.');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Test execution error:', err);
    process.exit(1);
  }); 
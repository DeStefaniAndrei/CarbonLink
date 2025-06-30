require('dotenv').config();
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

async function generateJWT() {
  try {
    // Check if credentials.json exists
    const credentialsPath = path.join(__dirname, '..', 'credentials.json');
    
    if (!fs.existsSync(credentialsPath)) {
      console.log('❌ credentials.json file not found!');
      console.log('\nPlease create a credentials.json file with your Sentinel Hub credentials:');
      console.log('{\n  "user_id": "your-user-id",\n  "private_key": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----"\n}');
      return;
    }

    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    
    // Check required environment variables (using the correct names from config.js)
    const clientId = process.env.SENTINEL_USER_ID;
    if (!clientId) {
      console.log('❌ SENTINEL_USER_ID not found in environment variables!');
      console.log('Please add it to your .env file');
      return;
    }

    // Check required credentials
    if (!credentials.user_id || !credentials.private_key) {
      console.log('❌ Missing required credentials!');
      console.log('credentials.json should contain: user_id and private_key');
      return;
    }

    // Generate JWT payload
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: clientId,                                    // issuer (your user ID)
      sub: credentials.user_id,                         // subject (your user ID)
      aud: 'https://services.sentinel-hub.com/oauth/token', // audience
      iat: now,                                        // issued at
      exp: now + 3600,                                 // expires in 1 hour
      jti: `jwt_${now}`                                // unique identifier
    };

    // Sign the JWT
    const token = jwt.sign(payload, credentials.private_key, { 
      algorithm: 'RS256' 
    });

    console.log('✅ JWT Token generated successfully!\n');
    console.log('=== Your JWT Token ===');
    console.log(token);
    console.log('\n=== OAuth Request Details ===');
    console.log('URL: https://services.sentinel-hub.com/oauth/token');
    console.log('Method: POST');
    console.log('Headers: Content-Type: application/x-www-form-urlencoded');
    console.log('\nBody (URL encoded):');
    console.log(`grant_type=client_credentials&client_id=${clientId}&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&client_assertion=${token}`);
    
    console.log('\n=== For Postman ===');
    console.log('1. Use the URL above');
    console.log('2. Set Content-Type header to: application/x-www-form-urlencoded');
    console.log('3. In Body tab, select x-www-form-urlencoded and add:');
    console.log(`   - grant_type: client_credentials`);
    console.log(`   - client_id: ${clientId}`);
    console.log(`   - client_assertion_type: urn:ietf:params:oauth:client-assertion-type:jwt-bearer`);
    console.log(`   - client_assertion: ${token}`);

  } catch (error) {
    console.error('❌ Error generating JWT:', error.message);
    
    if (error.message.includes('secretOrPrivateKey')) {
      console.log('\n💡 Make sure your private_key in credentials.json is properly formatted');
      console.log('It should look like:');
      console.log('-----BEGIN PRIVATE KEY-----');
      console.log('MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...');
      console.log('-----END PRIVATE KEY-----');
    }
  }
}

generateJWT(); 
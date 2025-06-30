require('dotenv').config();
const fetch = require('node-fetch');
const querystring = require('querystring');

async function testSentinelOAuth() {
    console.log('🔍 Testing Sentinel Hub OAuth Authentication\n');
    
    const client_id = process.env.SENTINEL_USER_ID;
    const client_secret = process.env.SENTINEL_SECRET;
    
    console.log('Client ID:', JSON.stringify(client_id));
    console.log('Client Secret:', JSON.stringify(client_secret));
    
    const body = querystring.stringify({
        client_id,
        client_secret,
        grant_type: 'client_credentials'
    });
    
    console.log('\nRequest body:', body);
    console.log('OAuth endpoint: https://services.sentinel-hub.com/auth/realms/main/protocol/openid-connect/token');
    
    try {
        const response = await fetch('https://services.sentinel-hub.com/auth/realms/main/protocol/openid-connect/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
            },
            body
        });
        
        console.log(`\nResponse status: ${response.status} - ${response.statusText}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ OAuth successful!');
            console.log('Access token:', data.access_token ? data.access_token.substring(0, 20) + '...' : 'undefined');
            console.log('Expires in:', data.expires_in, 'seconds');
            console.log('Token type:', data.token_type);
        } else {
            const errorText = await response.text();
            console.log('❌ OAuth failed!');
            console.log('Error response:', errorText);
        }
    } catch (error) {
        console.log('❌ Network error:', error.message);
    }
}

if (require.main === module) {
    testSentinelOAuth().catch(console.error);
}

module.exports = { testSentinelOAuth }; 
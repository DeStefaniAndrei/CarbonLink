require('dotenv').config();

async function testSentinelConnectivity() {
    console.log('🔍 Testing Sentinel API Connectivity\n');
    
    const sentinelKey = process.env.SENTINEL_API_KEY;
    console.log('Sentinel API Key:', JSON.stringify(sentinelKey));
    console.log('Key length:', sentinelKey ? sentinelKey.length : 'undefined');
    console.log('Key format:', sentinelKey ? (sentinelKey.includes('-') ? 'UUID-like' : 'Other') : 'undefined');
    
    // Test 1: Basic connectivity without auth
    console.log('\n1. Testing basic connectivity...');
    try {
        const response = await fetch('https://scihub.copernicus.eu/dhus/', {
            method: 'HEAD',
            timeout: 5000
        });
        console.log(`   ✅ Can reach scihub.copernicus.eu (Status: ${response.status})`);
    } catch (error) {
        console.log(`   ❌ Cannot reach scihub.copernicus.eu: ${error.message}`);
        return;
    }
    
    // Test 2: Try different authentication methods
    const authMethods = [
        {
            name: 'Basic Auth with username:key',
            auth: `Basic ${Buffer.from(`username:${sentinelKey}`).toString('base64')}`
        },
        {
            name: 'Basic Auth with key only',
            auth: `Basic ${Buffer.from(sentinelKey).toString('base64')}`
        },
        {
            name: 'Bearer token',
            auth: `Bearer ${sentinelKey}`
        }
    ];
    
    for (const method of authMethods) {
        console.log(`\n2. Testing ${method.name}...`);
        try {
            const response = await fetch('https://scihub.copernicus.eu/dhus/odata/v1/Products?$top=1', {
                headers: {
                    'Authorization': method.auth,
                    'User-Agent': 'CarbonLink/1.0'
                },
                timeout: 10000
            });
            
            console.log(`   Status: ${response.status} - ${response.statusText}`);
            if (response.ok) {
                console.log(`   ✅ ${method.name} works!`);
                const data = await response.text();
                console.log(`   Response length: ${data.length} characters`);
                break;
            } else if (response.status === 401) {
                console.log(`   ❌ Authentication failed`);
            } else {
                console.log(`   ⚠️  Unexpected status`);
            }
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }
    }
    
    // Test 3: Check if this is actually a Copernicus account
    console.log('\n3. Checking Copernicus account format...');
    console.log('   Note: Copernicus typically uses username/password, not API keys');
    console.log('   Your key format suggests this might be:');
    console.log('   - A different service (not Copernicus)');
    console.log('   - A UUID for a different API');
    console.log('   - A token from a third-party service');
    
    console.log('\n📋 Recommendations:');
    console.log('1. Check if you meant to use Copernicus Open Access Hub (free, no auth)');
    console.log('2. Verify if your key is for a different satellite data service');
    console.log('3. If using Copernicus, you might need username/password instead of API key');
}

if (require.main === module) {
    testSentinelConnectivity().catch(console.error);
}

module.exports = { testSentinelConnectivity }; 
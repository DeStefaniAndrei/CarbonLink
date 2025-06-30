const fetch = require('node-fetch');

async function testProjectCreation() {
  try {
    console.log('🧪 Testing project creation API...');
    
    const response = await fetch('http://localhost:3001/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test Project',
        location: '-2.5,-54.8',
        area: 10,
        projectType: 'reforestation',
        ownerAddress: '0x1234567890123456789012345678901234567890'
      })
    });

    const data = await response.json();
    
    console.log('✅ Response received:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('🎉 Project creation successful!');
      console.log(`📝 Project Address: ${data.data.projectAddress}`);
      console.log(`🔗 Transaction Hash: ${data.data.project.transactionHash}`);
    } else {
      console.log('❌ Project creation failed:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testProjectCreation(); 
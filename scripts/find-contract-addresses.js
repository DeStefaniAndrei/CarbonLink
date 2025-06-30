const fs = require('fs');
const path = require('path');

async function findContractAddresses() {
    console.log('🔍 Finding CarbonLink Contract Addresses...\n');

    try {
        // Read the deployment file
        const deploymentPath = path.join(__dirname, '..', '.openzeppelin', 'sepolia.json');
        const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));

        console.log('📋 Deployed Contracts on Sepolia:');
        console.log('=====================================');

        // Admin address
        console.log(`👑 Admin: ${deploymentData.admin.address}`);
        console.log(`   Transaction: ${deploymentData.admin.txHash}\n`);

        // Proxy contracts
        console.log('🏗️  Proxy Contracts:');
        deploymentData.proxies.forEach((proxy, index) => {
            console.log(`   ${index + 1}. ${proxy.address}`);
            console.log(`      Transaction: ${proxy.txHash}`);
            console.log(`      Type: ${proxy.kind}\n`);
        });

        // Implementation contracts
        console.log('⚙️  Implementation Contracts:');
        Object.entries(deploymentData.impls).forEach(([hash, impl]) => {
            console.log(`   Hash: ${hash}`);
            console.log(`   Address: ${impl.address}`);
            console.log(`   Transaction: ${impl.txHash}\n`);
        });

        // Based on the deployment script, identify which is which
        console.log('🎯 Contract Identification:');
        console.log('===========================');
        
        // The first proxy is likely the Factory (based on deployment order)
        if (deploymentData.proxies.length >= 1) {
            console.log(`🏭 Factory Contract: ${deploymentData.proxies[0].address}`);
        }
        
        // The second proxy is likely the Manager
        if (deploymentData.proxies.length >= 2) {
            console.log(`📊 Manager Contract: ${deploymentData.proxies[1].address}`);
        }

        // The third and fourth proxies are likely individual project contracts
        if (deploymentData.proxies.length >= 3) {
            console.log(`🌱 Project Contract 1: ${deploymentData.proxies[2].address}`);
        }
        if (deploymentData.proxies.length >= 4) {
            console.log(`🌱 Project Contract 2: ${deploymentData.proxies[3].address}`);
        }

        console.log('\n📝 For your .env file, use these addresses:');
        console.log('===========================================');
        console.log(`PROJECT_CONTRACT_ADDRESS=${deploymentData.proxies[2]?.address || 'NOT_DEPLOYED'}`);
        console.log(`MANAGER_CONTRACT_ADDRESS=${deploymentData.proxies[1]?.address || 'NOT_DEPLOYED'}`);

        // Verify on Sepolia Etherscan
        console.log('\n🔗 Verify on Etherscan:');
        console.log('=======================');
        deploymentData.proxies.forEach((proxy, index) => {
            console.log(`   ${index + 1}. https://sepolia.etherscan.io/address/${proxy.address}`);
        });

        return {
            admin: deploymentData.admin.address,
            proxies: deploymentData.proxies.map(p => p.address),
            implementations: Object.values(deploymentData.impls).map(impl => impl.address)
        };

    } catch (error) {
        console.error('❌ Error reading deployment file:', error.message);
        return null;
    }
}

// Run the script
if (require.main === module) {
    findContractAddresses();
}

module.exports = { findContractAddresses }; 
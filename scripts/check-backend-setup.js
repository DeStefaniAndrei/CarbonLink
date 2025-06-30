const { ethers } = require('ethers');
const { config } = require('../lib/config');

async function main() {
  console.log('--- Backend Setup Check ---');
  // Wallet
  if (!config.privateKey) {
    console.error('❌ PRIVATE_KEY not set in config');
    return;
  }
  const wallet = new ethers.Wallet(config.privateKey);
  console.log('Backend wallet address:', wallet.address);

  // Provider
  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
  const balance = await provider.getBalance(wallet.address);
  console.log('Sepolia ETH balance:', ethers.utils.formatEther(balance));

  // Contract addresses
  console.log('Manager Contract:', config.managerContractAddress);
  console.log('Project Contract:', config.projectContractAddress);

  // MainManager contract owner and initialized check
  if (!config.managerContractAddress) {
    console.error('❌ MANAGER_CONTRACT_ADDRESS not set');
    return;
  }
  const mainManagerAbi = [
    'function owner() view returns (address)',
    'function factory() view returns (address)',
    'function beacon() view returns (address)'
  ];
  const manager = new ethers.Contract(config.managerContractAddress, mainManagerAbi, provider);
  try {
    const owner = await manager.owner();
    console.log('MainManager owner:', owner);
    if (owner.toLowerCase() === wallet.address.toLowerCase()) {
      console.log('✅ Backend wallet IS the contract owner');
    } else {
      console.warn('⚠️ Backend wallet is NOT the contract owner');
    }
    const factory = await manager.factory();
    const beacon = await manager.beacon();
    console.log('MainManager factory address:', factory);
    console.log('MainManager beacon address:', beacon);
  } catch (err) {
    console.error('❌ Error reading MainManager contract:', err.message);
  }
}

main(); 
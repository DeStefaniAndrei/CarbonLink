# CarbonLink Chainlink Functions Setup Guide

This guide will help you set up and test Chainlink Functions integration for your CarbonLink project.

## Prerequisites

1. **Chainlink Functions Subscription**: You need a subscription on [Chainlink Functions](https://functions.chain.link/sepolia)
2. **LINK Tokens**: Your subscription needs to be funded with LINK tokens
3. **Environment Variables**: Set up your `.env` file with the required variables

## Step 1: Create Chainlink Functions Subscription

1. Go to [https://functions.chain.link/sepolia](https://functions.chain.link/sepolia)
2. Connect your wallet
3. Create a new subscription
4. Fund it with at least 1 LINK token
5. Note down your **Subscription ID**

## Step 2: Set Up Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# Network Configuration
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
PRIVATE_KEY=your_private_key_here

# Chainlink Functions Configuration
CHAINLINK_SUBSCRIPTION_ID=your_subscription_id_here
```

## Step 3: Deploy and Test

### Option A: Full Deployment with Testing

```bash
# Deploy all contracts and test Chainlink Functions
npx hardhat run scripts/deploy-and-test-functions.js --network sepolia
```

This script will:
- Deploy all your smart contracts
- Configure Chainlink Functions
- Create a test project
- Make a real Chainlink Functions request

### Option B: Run Tests Only

```bash
# Run the Chainlink Functions integration tests
npx hardhat test test/chainlink-functions-integration.js --network sepolia
```

### Option C: Manual Testing

If you already have contracts deployed, you can test manually:

```bash
# 1. Deploy contracts
npx hardhat run scripts/deploy-upgradeable-factory.js --network sepolia

# 2. Run tests
npx hardhat test test/chainlink-functions-integration.js --network sepolia
```

## Step 4: Monitor Your Requests

1. **Check Chainlink Dashboard**: Visit [https://functions.chain.link/sepolia](https://functions.chain.link/sepolia) to monitor your subscription
2. **Check Transaction Logs**: Look for the `CarbonDataRequested` event in your transaction receipts
3. **Monitor Contract State**: Check if credits were issued after the request completes

## Step 5: Frontend Integration

The `lib/chainlink-functions.ts` file provides a helper class for frontend integration:

```typescript
import { ChainlinkFunctionsHelper } from '@/lib/chainlink-functions';

// Initialize the helper
const helper = new ChainlinkFunctionsHelper(
  provider,
  signer,
  projectAddress,
  managerAddress
);

// Request carbon data
const requestId = await helper.requestCarbonData();

// Get project data
const projectData = await helper.getProjectData();
```

## Troubleshooting

### Common Issues

1. **"Insufficient LINK" Error**
   - Fund your subscription with more LINK tokens
   - Check your subscription balance on the Chainlink dashboard

2. **"Subscription not found" Error**
   - Verify your subscription ID is correct
   - Make sure you're using the right network (Sepolia)

3. **"Request failed" Error**
   - Check the Chainlink Functions dashboard for execution logs
   - Verify your source code is valid JavaScript
   - Check if your function returns the correct format

4. **"Gas limit exceeded" Error**
   - Increase the `callbackGasLimit` in your contract
   - Optimize your Chainlink Functions source code

### Debugging Tips

1. **Check Request Status**:
   ```bash
   # Look for CarbonDataRequested events
   npx hardhat console --network sepolia
   > const contract = await ethers.getContractAt("ProjectImplementation", "YOUR_PROJECT_ADDRESS")
   > const filter = contract.filters.CarbonDataRequested()
   > const events = await contract.queryFilter(filter)
   ```

2. **Monitor Contract State**:
   ```bash
   # Check if credits were issued
   > await contract.totalCreditsIssued()
   > await contract.bufferCredits()
   ```

3. **Test Source Code Locally**:
   - Copy your source code from `scripts/chainlink-functions-source.js`
   - Test it in the Chainlink Functions playground
   - Make sure it returns valid data

## Next Steps

Once your Chainlink Functions integration is working:

1. **Integrate with Real Data Sources**: Replace the mock data in your source code with real satellite/IoT APIs
2. **Add AI Models**: Integrate actual AI models for carbon credit calculation
3. **Implement Frontend**: Use the helper class to integrate with your React frontend
4. **Add Monitoring**: Set up alerts for failed requests and credit issuances
5. **Scale Up**: Deploy to mainnet and add more sophisticated verification logic

## Resources

- [Chainlink Functions Documentation](https://docs.chain.link/chainlink-functions)
- [Chainlink Functions Examples](https://github.com/smartcontractkit/functions-hardhat-starter-kit)
- [CarbonLink Project Documentation](README.md) 
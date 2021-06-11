const { ethers } = require('hardhat');
const { JsonRpcProvider } = require('@ethersproject/providers');
const { deploy, deployGatewayAndRegister } = require('./common');
require('dotenv').config; // eslint-disable-line

// needs to key to deploy contracts
if (!process.env.ALCHEMY_API_KEY ||
    !process.env.KOVAN_DEPLOYER_PRIV_KEY ||
    !process.env.L2_DEPLOYER_PRIV_KEY
) {
  process.exit(1);
}

const L1_RPC_URL = `https://eth-kovan.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`;
const L2_RPC_URL = 'https://kovan.optimism.io/';

const L1_DEPLOYER_PRIV_KEY = process.env.KOVAN_DEPLOYER_PRIV_KEY;
const L2_DEPLOYER_PRIV_KEY = process.env.L2_DEPLOYER_PRIV_KEY;

const L1_TX_OPTS = {
  gasPrice: 3000000000, // 3 gwei
};
const L2_TX_OPTS = {
  gasPrice: 0,
};

const L1_XDOMAIN_MESSENGER_ADDRESS = '0x78b88FD62FBdBf67b9C5C6528CF84E9d30BB28e0';
const L2_XDOMAIN_MESSENGER_ADDRESS = '0x4200000000000000000000000000000000000007';

async function main () {
  console.log('Deploying on Kovan');
  const l1Provider = new JsonRpcProvider(L1_RPC_URL);
  const l1Deployer = new ethers.Wallet(L1_DEPLOYER_PRIV_KEY, l1Provider);

  const l2Provider = new JsonRpcProvider(L2_RPC_URL);
  const l2Deployer = new ethers.Wallet(L2_DEPLOYER_PRIV_KEY, l2Provider);

  const L1_TON_ADDRESS = process.env.L1_TON_ADDRESS || await deploy(l1Deployer, 'L1TON', L1_TX_OPTS);
  const L1_ESCROW_ADDRESS = process.env.L1_ESCROW_ADDRESS || await deploy(l1Deployer, 'L1Escrow', L1_TX_OPTS);
  const L1_GATEWAY_REGISTRY_ADDRESS = process.env.L1_GATEWAY_REGISTRY_ADDRESS ||
                                      await deploy(l1Deployer, 'L1GatewayRegistry', L1_TX_OPTS);

  await deployGatewayAndRegister(
    l1Deployer,
    l2Deployer,
    L1_TON_ADDRESS,
    L1_ESCROW_ADDRESS,
    L1_GATEWAY_REGISTRY_ADDRESS,
    L1_XDOMAIN_MESSENGER_ADDRESS,
    L2_XDOMAIN_MESSENGER_ADDRESS,
    L1_TX_OPTS,
    L2_TX_OPTS,
  );
}

main()
  .then(() => console.log('DONE'))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

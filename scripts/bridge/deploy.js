const { ethers } = require('hardhat');
const { JsonRpcProvider } = require('@ethersproject/providers');
const { deployBridge } = require('../common');
require('dotenv').config; // eslint-disable-line

if (!process.env.L1_DEPLOYER_PRIV_KEY ||
    !process.env.L2_DEPLOYER_PRIV_KEY ||
    !process.env.L1_MESSENGER_ADDRESS ||
    !process.env.L2_MESSENGER_ADDRESS
) {
  console.log('Copy .env.example as .env and fill it out...');
  process.exit(1);
}

const L1_RPC_URL = process.env.DEVELOPMENT ? 'http://127.0.0.1:9545' : 'https://rinkeby.rpc.tokamak.network/';
const L2_RPC_URL = process.env.DEVELOPMENT ? 'http://127.0.0.1:8545' : 'https://testnet1.optimism.tokamak.network/';

const L1_DEPLOYER_PRIV_KEY = process.env.L1_DEPLOYER_PRIV_KEY;
const L2_DEPLOYER_PRIV_KEY = process.env.L2_DEPLOYER_PRIV_KEY;

const L1_MESSENGER_ADDRESS = process.env.L1_MESSENGER_ADDRESS;
const L2_MESSENGER_ADDRESS = process.env.L2_MESSENGER_ADDRESS;

const L1_TX_OPTS = {
  gasPrice: 1000000000, // 1 gwei
};
const L2_TX_OPTS = {
  gasPrice: 0,
};

async function main () {
  console.log('Deploying...');
  const l1Provider = new JsonRpcProvider(L1_RPC_URL);
  const l1Deployer = new ethers.Wallet(L1_DEPLOYER_PRIV_KEY, l1Provider);

  const l2Provider = new JsonRpcProvider(L2_RPC_URL);
  const l2Deployer = new ethers.Wallet(L2_DEPLOYER_PRIV_KEY, l2Provider);

  await deployBridge(
    l1Deployer,
    l2Deployer,
    L1_MESSENGER_ADDRESS,
    L2_MESSENGER_ADDRESS,
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

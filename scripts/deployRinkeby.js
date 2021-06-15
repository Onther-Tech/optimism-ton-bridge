const { ethers } = require('hardhat');
const { JsonRpcProvider } = require('@ethersproject/providers');
const { deploy, deployGatewayAndRegister } = require('./common');
require('dotenv').config; // eslint-disable-line

// needs key to deploy contracts
if (!process.env.ALCHEMY_API_KEY ||
    !process.env.RINKEBY_DEPLOYER_PRIV_KEY ||
    !process.env.L2_DEPLOYER_PRIV_KEY
) {
  process.exit(1);
}

const L1_RPC_URL = 'https://rinkeby.rpc.tokamak.network/';
const L2_RPC_URL = 'https://testnet1.optimism.tokamak.network/';

const L1_DEPLOYER_PRIV_KEY = process.env.RINKEBY_DEPLOYER_PRIV_KEY;
const L2_DEPLOYER_PRIV_KEY = process.env.L2_DEPLOYER_PRIV_KEY;

const L1_TX_OPTS = {
  gasPrice: 1000000000, // 1 gwei
};
const L2_TX_OPTS = {
  gasPrice: 0,
};

const L1_XDOMAIN_MESSENGER_ADDRESS = '0xaFD9bB316D38aBB0400a53963A9324AB26eda97C';
const L2_XDOMAIN_MESSENGER_ADDRESS = '0x4200000000000000000000000000000000000007';

async function main () {
  console.log('Deploying on Rinkeby');
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

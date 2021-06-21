const { ethers } = require('hardhat');
const { JsonRpcProvider } = require('@ethersproject/providers');
const { Watcher } = require('@eth-optimism/watcher');
const { getContractAt, getL2ContractAt, waitForTx } = require('../test-e2e/helpers/utils');
require('dotenv').config; // eslint-disable-line

const L1_RPC_URL = 'https://rinkeby.rpc.tokamak.network/';
const L2_RPC_URL = 'https://testnet1.optimism.tokamak.network/';
const l1Provider = new JsonRpcProvider(L1_RPC_URL);
const l2Provider = new JsonRpcProvider(L2_RPC_URL);

const L1_DEPLOYER_PRIV_KEY = process.env.L1_DEPLOYER_PRIV_KEY;
const L2_DEPLOYER_PRIV_KEY = process.env.L2_DEPLOYER_PRIV_KEY;
const TEST_USER_KEY = process.env.TEST_USER_KEY;

const L1_ESCROW_ADDRESS = process.env.L1_ESCROW_ADDRESS;
const L1_GATEWAY_REGISTRY_ADDRESS = process.env.L1_GATEWAY_REGISTRY_ADDRESS;
const L1_GATEWAY_ADDRESS = process.env.L1_GATEWAY_ADDRESS;
const L2_GATEWAY_ADDRESS = process.env.L2_GATEWAY_ADDRESS;
const L1_TON_ADDRESS = process.env.L1_TON_ADDRESS;
const L2_TOKEN_ADDRESS = process.env.L2_TOKEN_ADDRESS;
const L1_MESSENGER_ADDRESS = process.env.L1_MESSENGER_ADDRESS;
const L2_MESSENGER_ADDRESS = process.env.L2_MESSENGER_ADDRESS;

const L1_TX_OPTS = {
  gasPrice: 3000000000, // 3 gwei
};
const L2_TX_OPTS = {
  gasPrice: 0,
};

const watcher = new Watcher({
  l1: {
    provider: l1Provider,
    messengerAddress: L1_MESSENGER_ADDRESS,
  },
  l2: {
    provider: l2Provider,
    messengerAddress: L2_MESSENGER_ADDRESS,
  },
});

const zeroAddress = ethers.constants.AddressZero;
const depositAmount = 100;

async function main () {
  const user = ethers.utils.computeAddress(`0x${TEST_USER_KEY}`);
  const l1Signer = new ethers.Wallet(L1_DEPLOYER_PRIV_KEY, l1Provider);
  const l2Signer = new ethers.Wallet(L2_DEPLOYER_PRIV_KEY, l2Provider);

  const l1Escrow = await getContractAt(L1_ESCROW_ADDRESS, 'L1Escrow', l1Signer);
  const l1TON = await getContractAt(L1_TON_ADDRESS, 'L1TON', l1Signer);
  const l2Token = await getL2ContractAt(L2_TOKEN_ADDRESS, 'L2Token', l2Signer);

  const l1GatewayRegistry = await getContractAt(L1_GATEWAY_REGISTRY_ADDRESS, 'L1GatewayRegistry', l1Signer);
  const l1Gateway = await getContractAt(L1_GATEWAY_ADDRESS, 'L1Gateway', l1Signer);
  const l2Gateway = await getL2ContractAt(L2_GATEWAY_ADDRESS, 'L2Gateway', l2Signer);

  const escrowAllowance = await l1TON.allowance(l1Escrow.address, l1Gateway.address);
  if (escrowAllowance < depositAmount) {
    console.log('Approving from escrow...');
    await waitForTx(l1Escrow.approve(l1TON.address, l1Gateway.address, ethers.constants.MaxUint256, L1_TX_OPTS));
  }

  const registered = await l1GatewayRegistry.registered(l1Gateway.address, l2Gateway.address);
  if (!registered) {
    console.log('Registering l1 gateway and l2 gateway...');
    await waitForTx(l1GatewayRegistry.register(l1Gateway.address, l2Gateway.address, L1_TX_OPTS));
  }

  const gateway = await l2Gateway.l1TokenGateway();
  if (gateway === zeroAddress) {
    console.log('Initiating l2 gateway...');
    await waitForTx(l2Gateway.init(l1Gateway.address, L2_TX_OPTS));
  }

  const balance = await l1TON.balanceOf(user);
  if (balance < depositAmount) {
    console.log('Minting token...');
    await waitForTx(l1TON.mint(user, depositAmount * 100, L1_TX_OPTS));
  }

  const allowanceFromUser = await l1TON.allowance(user, l1Gateway.address);
  if (allowanceFromUser < depositAmount) {
    console.log('Approving from token...');
    await waitForTx(l1TON.approve(l1Gateway.address, depositAmount, L1_TX_OPTS));
  }

  console.log(`
=====================
before deposit 👇👇👇
=====================
L1TON
👉 user: ${(await l1TON.balanceOf(user)).toString()}
👉 escrow: ${(await l1TON.balanceOf(l1Escrow.address)).toString()}

L2Token
👉 user: ${(await l2Token.balanceOf(user)).toString()}
`);

  console.log('Depositing token from l1 into l2...');
  const l1Tx = await l1Gateway.deposit(depositAmount, L1_TX_OPTS);
  await l1Tx.wait();

  console.log('Waiting for deposit to be relayed to L2...');
  const [ messageHash ] = await watcher.getMessageHashesFromL1Tx(l1Tx.hash);
  await watcher.getL2TransactionReceipt(messageHash);

  console.log(`
=====================
after deposit 👇👇👇
=====================
L1TON
👉 user: ${(await l1TON.balanceOf(user)).toString()}
👉 escrow: ${(await l1TON.balanceOf(l1Escrow.address)).toString()}

L2Token
👉 user: ${(await l2Token.balanceOf(user)).toString()}
`);
}

main()
  .then(() => console.log('DONE'))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

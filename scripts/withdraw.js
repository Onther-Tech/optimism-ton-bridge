const { ethers } = require('hardhat');
const { JsonRpcProvider } = require('@ethersproject/providers');
const { Watcher } = require('@eth-optimism/watcher');
const { getContractAt, getL2ContractAt, waitForTx } = require('../test-e2e/helpers/utils');
require('dotenv').config; // eslint-disable-line

const L1_RPC_URL = 'https://rinkeby.rpc.tokamak.network/';
const L2_RPC_URL = 'https://testnet1.optimism.tokamak.network/';

const TEST_USER_KEY = process.env.TEST_USER_KEY;

const L2_TX_OPTS = {
  gasPrice: 0,
};

const L1_ESCROW_ADDRESS = process.env.L1_ESCROW_ADDRESS;
const L2_GATEWAY_ADDRESS = process.env.L2_GATEWAY_ADDRESS;
const L1_TON_ADDRESS = process.env.L1_TON_ADDRESS;
const L2_TON_ADDRESS = process.env.L2_TON_ADDRESS;

const L1_MESSENGER_ADDRESS = process.env.L1_MESSENGER_ADDRESS;
const L2_MESSENGER_ADDRESS = process.env.L2_MESSENGER_ADDRESS;

const withdrawAmount = 100;

const l1Provider = new JsonRpcProvider(L1_RPC_URL);
const l2Provider = new JsonRpcProvider(L2_RPC_URL);
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

async function main () {
  const user = ethers.utils.computeAddress(`0x${TEST_USER_KEY}`);
  const l1Signer = new ethers.Wallet(TEST_USER_KEY, l1Provider);
  const l2Signer = new ethers.Wallet(TEST_USER_KEY, l2Provider);

  const l1Escrow = await getContractAt(L1_ESCROW_ADDRESS, 'L1Escrow', l1Signer);
  const l1TON = await getContractAt(L1_TON_ADDRESS, 'L1TON', l1Signer);
  const l2TON = await getL2ContractAt(L2_TON_ADDRESS, 'L2TON', l2Signer);

  const l2Gateway = await getL2ContractAt(L2_GATEWAY_ADDRESS, 'L2Gateway', l2Signer);

  const balance = await l2TON.balanceOf(user);
  if (balance < withdrawAmount) {
    console.log('Minting token...');
    await waitForTx(l2TON.mint(user, withdrawAmount * 100, L2_TX_OPTS));
  }

  console.log(`
======================
before withdraw 👇👇👇
======================
L1TON
👉 user: ${(await l1TON.balanceOf(user)).toString()}
👉 escrow: ${(await l1TON.balanceOf(l1Escrow.address)).toString()}

L2TON
👉 user: ${(await l2TON.balanceOf(user)).toString()}
`);

  console.log('Withdrawing token from l2 into l1...');
  const l2Tx = await l2Gateway.withdraw(withdrawAmount, L2_TX_OPTS);
  await l2Tx.wait();

  console.log('Waiting for withdrawal to be relayed to L1...');
  const [ messageHash ] = await watcher.getMessageHashesFromL2Tx(l2Tx.hash);
  await watcher.getL1TransactionReceipt(messageHash);

  console.log(`
======================
after withdraw 👇👇👇
======================
L1TON
👉 user: ${(await l1TON.balanceOf(user)).toString()}
👉 escrow: ${(await l1TON.balanceOf(l1Escrow.address)).toString()}

L2TON
👉 user: ${(await l2TON.balanceOf(user)).toString()}
`);
}

main()
  .then(() => console.log('DONE'))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

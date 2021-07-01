const { ethers } = require('hardhat');
const { JsonRpcProvider } = require('@ethersproject/providers');
const { Watcher } = require('@eth-optimism/watcher');
const { getContractAt, getL2ContractAt, waitForTx } = require('../../test-e2e/helpers/utils');
require('dotenv').config; // eslint-disable-line

if (process.env.DEVELOPMENT) {
  console.log('DEVELOPMENT MODE');
}
const L1_RPC_URL = process.env.DEVELOPMENT ? 'http://127.0.0.1:9545' : 'https://rinkeby.rpc.tokamak.network/';
const L2_RPC_URL = process.env.DEVELOPMENT ? 'http://127.0.0.1:8545' : 'https://testnet1.optimism.tokamak.network/';
const l1Provider = new JsonRpcProvider(L1_RPC_URL);
const l2Provider = new JsonRpcProvider(L2_RPC_URL);

const L1_DEPLOYER_PRIV_KEY = process.env.L1_DEPLOYER_PRIV_KEY;
const L2_DEPLOYER_PRIV_KEY = process.env.L2_DEPLOYER_PRIV_KEY;
const TEST_USER_KEY = process.env.TEST_USER_KEY;

const L1_TOKEN_ADDRESS = process.env.L1_TOKEN_ADDRESS;
const L2_TOKEN_ADDRESS = process.env.L2_TOKEN_ADDRESS;
const L1_BRIDGE_ADDRESS = process.env.L1_BRIDGE_ADDRESS;
const L2_BRIDGE_ADDRESS = process.env.L2_BRIDGE_ADDRESS;
const L1_MESSENGER_ADDRESS = process.env.L1_MESSENGER_ADDRESS;
const L2_MESSENGER_ADDRESS = process.env.L2_MESSENGER_ADDRESS;

if (!L1_DEPLOYER_PRIV_KEY || !L2_DEPLOYER_PRIV_KEY || !TEST_USER_KEY ||
    !L1_TOKEN_ADDRESS || !L2_TOKEN_ADDRESS ||
    !L1_BRIDGE_ADDRESS || !L2_BRIDGE_ADDRESS ||
    !L1_MESSENGER_ADDRESS || !L2_MESSENGER_ADDRESS
) {
  console.error('Please fill out .env file');
  process.exit(1);
}

const L1_TX_OPTS = {
  gasLimit: 8000000,
  gasPrice: 1000000000, // 1 gwei
};
const DEPOSIT_AMOUNT = 100;
const FINALIZATION_GAS = 1200000;
const NON_NULL_BYTES32 =
  '0x1111111111111111111111111111111111111111111111111111111111111111';

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
  const l1Signer = new ethers.Wallet(L1_DEPLOYER_PRIV_KEY, l1Provider);
  const l2Signer = new ethers.Wallet(L2_DEPLOYER_PRIV_KEY, l2Provider);

  const l1Token = await getContractAt(L1_TOKEN_ADDRESS, 'ERC20NoOwnership', l1Signer);
  const l2Token = await getL2ContractAt(L2_TOKEN_ADDRESS, 'L2ERC20', l2Signer);
  const l1Bridge = await getContractAt(L1_BRIDGE_ADDRESS, 'OVM_L1StandardBridge', l1Signer);

  const balance = await l1Token.balanceOf(user);
  if (balance < DEPOSIT_AMOUNT) {
    console.log('Minting token...');
    await waitForTx(l1Token.mint(user, DEPOSIT_AMOUNT * 1000, L1_TX_OPTS));
  }

  const allowance = await l1Token.allowance(user, l1Bridge.address);
  if (allowance < DEPOSIT_AMOUNT) {
    console.log('Approving token usage...');
    await waitForTx(l1Token.approve(l1Bridge.address, DEPOSIT_AMOUNT * 1000, L1_TX_OPTS));
  }

  console.log(`
=====================
before deposit 👇👇👇
=====================
L1Token
👉 user: ${(await l1Token.balanceOf(user)).toString()}
👉 l1-bridge: ${(await l1Token.balanceOf(l1Bridge.address)).toString()}

L2Token
👉 user: ${(await l2Token.balanceOf(user)).toString()}
`);

  console.log('Depositing token from l1 into l2...');
  const l1Tx = await l1Bridge.depositERC20(
    l1Token.address,
    l2Token.address,
    DEPOSIT_AMOUNT,
    FINALIZATION_GAS,
    NON_NULL_BYTES32,
    L1_TX_OPTS,
  );
  await l1Tx.wait();

  console.log('Waiting for deposit to be relayed to L2...');
  const [ messageHash ] = await watcher.getMessageHashesFromL1Tx(l1Tx.hash);
  const res = await watcher.getL2TransactionReceipt(messageHash);
  console.log(res);

  console.log(`
=====================
after deposit 👇👇👇
=====================
L1Token
👉 user: ${(await l1Token.balanceOf(user)).toString()}
👉 l1-bridge: ${(await l1Token.balanceOf(l1Bridge.address)).toString()}

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

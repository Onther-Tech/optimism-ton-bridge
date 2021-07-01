const { ethers } = require('hardhat');
const { deployContract, getL2ContractFactory } = require('../test-e2e/helpers/utils');

async function deployBridge (
  l1Deployer,
  l2Deployer,
  l1XDomainMessengerAddress,
  l2XDomainMessengerAddress,
  l1TxOpts,
  l2TxOpts,
) {
  const l1TokenNoOwnership = await deployContract(
    l1Deployer,
    await ethers.getContractFactory('ERC20NoOwnership'),
    [l1TxOpts],
  );
  console.log(`L1_TOKEN_ADDRESS=${l1TokenNoOwnership.address}`);

  const l1StandardBridge = await deployContract(
    l1Deployer,
    await ethers.getContractFactory('OVM_L1StandardBridge'),
    [l1TxOpts],
  );
  console.log(`L1_BRIDGE_ADDRESS=${l1StandardBridge.address}`);

  const l2StandardBridge = await deployContract(
    l2Deployer,
    await getL2ContractFactory('OVM_L2StandardBridge'),
    [l2XDomainMessengerAddress, l1StandardBridge.address, l2TxOpts],
  );
  console.log(`L2_BRIDGE_ADDRESS=${l2StandardBridge.address}`);

  const l2ERC20 = await deployContract(
    l2Deployer,
    await getL2ContractFactory('L2ERC20'),
    [l2StandardBridge.address, l1TokenNoOwnership.address, l2TxOpts],
  );
  console.log(`L2_TOKEN_ADDRESS=${l2ERC20.address}`);

  await l1StandardBridge.initialize(l1XDomainMessengerAddress, l2StandardBridge.address, {
    gasLimit: 8000000,
    gasPrice: 1000000000, // 1 gwei
  });
}

async function deployGatewayAndRegister (
  l1Deployer,
  l2Deployer,
  l1TONAddress,
  l1EscrowAddress,
  l1XDomainMessengerAddress,
  l2XDomainMessengerAddress,
  l1TxOpts,
  l2TxOpts,
) {
  const l2Gateway = await deployContract(l2Deployer, await getL2ContractFactory('L2Gateway'), [
    l2XDomainMessengerAddress,
    'ERC20 Token Layer 2',
    'TOKEN-L2',
    l2TxOpts,
  ]);
  console.log('L2Token:', await l2Gateway.token());
  console.log('L2Gateway:', l2Gateway.address);

  const l1Gateway = await deployContract(l1Deployer, await ethers.getContractFactory('L1Gateway'), [
    l1TONAddress,
    l2Gateway.address,
    l1XDomainMessengerAddress,
    l1EscrowAddress,
    l1TxOpts,
  ]);
  console.log('L1Gateway:', l1Gateway.address);
}

async function deploy (deployer, l1Contract, l1TxOpts) {
  const contract = await deployContract(deployer, await ethers.getContractFactory(l1Contract), [l1TxOpts]);
  console.log(`${l1Contract}:`, contract.address);

  return contract.address;
}

module.exports = {
  deploy,
  deployBridge,
  deployGatewayAndRegister,
};

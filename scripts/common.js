const { ethers } = require('hardhat');
const { deployContract, getL2ContractFactory } = require('../test-e2e/helpers/utils');

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
  deployGatewayAndRegister,
};

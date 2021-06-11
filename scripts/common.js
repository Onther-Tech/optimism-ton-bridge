const { ethers } = require('hardhat');
const { deployContract, getL2ContractFactory, waitForTx } = require('../test-e2e/helpers/utils');

async function deployGatewayAndRegister (
  l1Deployer,
  l2Deployer,
  l1TONAddress,
  l1EscrowAddress,
  l1GatewayRegistryAddress,
  l1XDomainMessengerAddress,
  l2XDomainMessengerAddress,
  l1TxOpts,
  l2TxOpts,
) {
  const l2TON = await deployContract(l2Deployer, await getL2ContractFactory('L2TON'), [l2TxOpts]);
  console.log('L2TON:', l2TON.address);

  const l2Gateway = await deployContract(l2Deployer, await getL2ContractFactory('L2Gateway'), [
    l2XDomainMessengerAddress,
    l2TON.address,
    l2TxOpts,
  ]);
  console.log('L2Gateway:', l2Gateway.address);

  const l1Gateway = await deployContract(l1Deployer, await ethers.getContractFactory('L1Gateway'), [
    l1TONAddress,
    l2Gateway.address,
    l1XDomainMessengerAddress,
    l1EscrowAddress,
    l1TxOpts,
  ]);
  console.log('L1Gateway:', l1Gateway.address);

  console.log(`
all the contracts are deployed:
- layer 1:
  - L1TON                 : ${l1TONAddress}
  - L1Gateway             : ${l1Gateway.address}
  - L1CrossDomainMessenger: ${l1XDomainMessengerAddress}
  - L1Escrow              : ${l1EscrowAddress}
  - l1GatewayRegistry     : ${l1GatewayRegistryAddress}

- layer 2:
  - L2TON                 : ${l2TON.address}
  - L2Gateway             : ${l2Gateway.address}
  - L2CrossDomainMessenger: ${l2XDomainMessengerAddress}
`);

  const l1GatewayRegistry = await ethers.getContractAt('L1GatewayRegistry', l1GatewayRegistryAddress, l1Deployer);
  await waitForTx(l1GatewayRegistry.register(l1Gateway.address, l2Gateway.address, l1TxOpts));
  console.log('L1Gateway and L2Gateway are successfully registered');
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

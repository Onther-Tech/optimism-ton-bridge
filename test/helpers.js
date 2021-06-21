const { ethers } = require('hardhat');
const { smockit } = require('@eth-optimism/smock');

async function deploy (
  name,
  args,
) {
  const factory = (await ethers.getContractFactory(name));
  return factory.deploy(...(args || []));
}

async function deployMock (
  name,
  address,
  provider,
) {
  const factory = (await ethers.getContractFactory(name));
  return await smockit(factory, {
    address,
    provider,
  });
}

async function deployed (name, address, signerOrProvider) {
  const factory = await ethers.getContractFactory(name);
  return new ethers.Contract(address, factory.interface, signerOrProvider);
}

module.exports = {
  deploy,
  deployMock,
  deployed,
};

const { expect } = require('chai');
const { ethers } = require('hardhat');
const { deploy } = require('../helpers');

const errorMessages = {
  identicalAddress: 'L1GatewayRegistry/identical-address',
  zeroAddress: 'L1GatewayRegistry/zero-address',
  alreadyRegistered: 'L1GatewayRegistry/already-registered',
};

const address = ethers.utils.getAddress('0x' + 'a'.repeat(40));
const zeroAddress = ethers.utils.getAddress('0x' + '0'.repeat(40));
const upperAddress = ethers.utils.getAddress('0x' + 'f'.repeat(40));

describe('L1GatewayRegistry', () => {
  describe('register()', () => {
    it('registers gateway0 and gateway1', async () => {
      const l1Gateway = address;
      const l2Gateway = upperAddress;
      const l1GatewayRegistry = await deploy('L1GatewayRegistry');

      await l1GatewayRegistry.register(l1Gateway, l2Gateway);
      expect(await l1GatewayRegistry.registered(l1Gateway, l2Gateway)).to.be.eq(true);
    });

    it('emits GatewayRegistered event', async () => {
      const l1Gateway = address;
      const l2Gateway = upperAddress;
      const l1GatewayRegistry = await deploy('L1GatewayRegistry');

      await expect(l1GatewayRegistry.register(l1Gateway, l2Gateway))
        .to.emit(l1GatewayRegistry, 'GatewayRegistered')
        .withArgs(l1Gateway, l2Gateway);
    });

    it('reverts when using identical address', async () => {
      const l1Gateway = address;
      const l2Gateway = address;
      const l1GatewayRegistry = await deploy('L1GatewayRegistry');

      await expect(
        l1GatewayRegistry.register(l1Gateway, l2Gateway),
      ).to.be.revertedWith(errorMessages.identicalAddress);
    });

    it('reverts when using zero address', async () => {
      const l1Gateway = address;
      const l2Gateway = zeroAddress;
      const l1GatewayRegistry = await deploy('L1GatewayRegistry');

      await expect(
        l1GatewayRegistry.register(l1Gateway, l2Gateway),
      ).to.be.revertedWith(errorMessages.zeroAddress);
    });

    it('reverts when gateway is already registered', async () => {
      const l1Gateway = address;
      const l2Gateway = upperAddress;
      const l1GatewayRegistry = await deploy('L1GatewayRegistry');

      await l1GatewayRegistry.register(l1Gateway, l2Gateway);

      await expect(
        l1GatewayRegistry.register(l1Gateway, l2Gateway),
      ).to.be.revertedWith(errorMessages.alreadyRegistered);
    });
  });
});

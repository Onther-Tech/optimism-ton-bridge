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
      const gateway0 = address;
      const gateway1 = upperAddress;
      const l1GatewayRegistry = await deploy('L1GatewayRegistry');

      await l1GatewayRegistry.register(gateway0, gateway1);
      expect(await l1GatewayRegistry.isRegistered(gateway0, gateway1)).to.be.eq(true);
      expect(await l1GatewayRegistry.isRegistered(gateway1, gateway0)).to.be.eq(true);
    });

    it('emits GatewayRegistered event', async () => {
      const gateway0 = address;
      const gateway1 = upperAddress;
      const l1GatewayRegistry = await deploy('L1GatewayRegistry');

      await expect(l1GatewayRegistry.register(gateway0, gateway1))
        .to.emit(l1GatewayRegistry, 'GatewayRegistered')
        .withArgs(gateway0, gateway1);
    });

    it('reverts when using identical address', async () => {
      const gateway0 = address;
      const gateway1 = address;
      const l1GatewayRegistry = await deploy('L1GatewayRegistry');

      await expect(
        l1GatewayRegistry.register(gateway0, gateway1),
      ).to.be.revertedWith(errorMessages.identicalAddress);
    });

    it('reverts when using zero address', async () => {
      const gateway0 = address;
      const gateway1 = zeroAddress;
      const l1GatewayRegistry = await deploy('L1GatewayRegistry');

      await expect(
        l1GatewayRegistry.register(gateway0, gateway1),
      ).to.be.revertedWith(errorMessages.zeroAddress);
    });

    it('reverts when gateway is already registered', async () => {
      const gateway0 = address;
      const gateway1 = upperAddress;
      const l1GatewayRegistry = await deploy('L1GatewayRegistry');

      await l1GatewayRegistry.register(gateway0, gateway1);

      await expect(
        l1GatewayRegistry.register(gateway0, gateway1),
      ).to.be.revertedWith(errorMessages.alreadyRegistered);
    });
  });
});

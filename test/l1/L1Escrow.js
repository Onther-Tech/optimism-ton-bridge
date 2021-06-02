
const { expect } = require('chai');
const { ethers } = require('hardhat');
const { deploy } = require('../helpers');

const allowanceLimit = 100;

const errorMessages = {
  notAuthed: 'L1Escrow/not-authorized',
};

describe('L1Escrow', () => {
  describe('approve()', () => {
    it('sets approval on erc20 tokens', async () => {
      const [_deployer, spender] = await ethers.getSigners(); // eslint-disable-line
      const { l1TON, l1Escrow } = await setupTest();

      expect(await l1TON.allowance(l1Escrow.address, spender.address)).to.be.eq(0);

      await l1Escrow.approve(l1TON.address, spender.address, allowanceLimit);

      expect(await l1TON.allowance(l1Escrow.address, spender.address)).to.be.eq(allowanceLimit);
    });

    it('emits Approval event', async () => {
      const [_deployer, spender] = await ethers.getSigners(); // eslint-disable-line
      const { l1TON, l1Escrow } = await setupTest();

      await expect(l1Escrow.approve(l1TON.address, spender.address, allowanceLimit))
        .to.emit(l1Escrow, 'Approve')
        .withArgs(l1TON.address, spender.address, allowanceLimit);
    });

    it('reverts when called by unauthed user', async () => {
      const [_deployer, spender, notDeployer] = await ethers.getSigners(); // eslint-disable-line
      const { l1TON, l1Escrow } = await setupTest();

      await expect(
        l1Escrow.connect(notDeployer).approve(l1TON.address, spender.address, allowanceLimit),
      ).to.be.revertedWith(errorMessages.notAuthed);
    });
  });
});

async function setupTest () {
  const l1TON = await deploy('L1TON', []);
  const l1Escrow = await deploy('L1Escrow', []);

  return { l1TON, l1Escrow };
}

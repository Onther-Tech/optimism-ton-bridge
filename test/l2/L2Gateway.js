const { expect } = require('chai');
const { ethers } = require('hardhat');
const { deploy, deployMock } = require('../helpers');

const errorMessages = {
  invalidMessenger: 'OVM_XCHAIN: messenger contract unauthenticated',
  invalidXDomainMessageOriginator: 'OVM_XCHAIN: wrong sender of cross-domain message',
  alreadyInitialized: 'Contract has already been initialized',
  notInitialized: 'Contract has not yet been initialized',
  bridgeClosed: 'L2Gateway/closed',
  notOwner: 'L2Gateway/not-authorized',
  tonInsufficientBalanceToBurn: 'ERC20: burn amount exceeds balance',
  tonNotAuthorized: 'L2TON/not-authorized',
};

describe('L2Gateway', () => {
  describe('finalizeDeposit', () => {
    const depositAmount = 100;

    it('mints new tokens', async () => {
      const [_, l2MessengerImpersonator, user1] = await ethers.getSigners();
      const { l2TON, l1GatewayMock, l2CrossDomainMessengerMock, l2Gateway } = await setupTest(l2MessengerImpersonator);
      l2CrossDomainMessengerMock.smocked.xDomainMessageSender.will.return.with(() => l1GatewayMock.address);

      await l2Gateway.connect(l2MessengerImpersonator).finalizeDeposit(user1.address, depositAmount);

      expect(await l2TON.balanceOf(user1.address)).to.be.eq(depositAmount);
      expect(await l2TON.totalSupply()).to.be.eq(depositAmount);
    });

    it('completes deposits even when closed', async () => {
      const [_, l2MessengerImpersonator, user1] = await ethers.getSigners();
      const { l2TON, l1GatewayMock, l2CrossDomainMessengerMock, l2Gateway } = await setupTest(l2MessengerImpersonator);
      await l2Gateway.close();
      l2CrossDomainMessengerMock.smocked.xDomainMessageSender.will.return.with(() => l1GatewayMock.address);

      await l2Gateway.connect(l2MessengerImpersonator).finalizeDeposit(user1.address, depositAmount);

      expect(await l2TON.balanceOf(user1.address)).to.be.eq(depositAmount);
      expect(await l2TON.totalSupply()).to.be.eq(depositAmount);
    });

    // if bridge is closed properly this shouldn't happen
    it('reverts when TON minting access was revoked', async () => {
      const [_, l2MessengerImpersonator, user1] = await ethers.getSigners();
      const { l2TON, l1GatewayMock, l2CrossDomainMessengerMock, l2Gateway } = await setupTest(l2MessengerImpersonator);
      l2CrossDomainMessengerMock.smocked.xDomainMessageSender.will.return.with(() => l1GatewayMock.address);

      await l2TON.deny(l2Gateway.address);

      await expect(
        l2Gateway.connect(l2MessengerImpersonator).finalizeDeposit(user1.address, depositAmount),
      ).to.be.revertedWith(errorMessages.tonNotAuthorized);
    });

    it('reverts when called not by XDomainMessenger', async () => {
      const [_, l2MessengerImpersonator, user1, user2] = await ethers.getSigners();
      const { l1GatewayMock, l2CrossDomainMessengerMock, l2Gateway } = await setupTest(l2MessengerImpersonator);
      l2CrossDomainMessengerMock.smocked.xDomainMessageSender.will.return.with(() => l1GatewayMock.address);

      await expect(l2Gateway.connect(user2).finalizeDeposit(user1.address, depositAmount)).to.be.revertedWith(
        errorMessages.invalidMessenger,
      );
    });

    it('reverts when called by XDomainMessenger but not relying message from l1ERC20Gateway', async () => {
      const [_, l2MessengerImpersonator, user1, user2] = await ethers.getSigners();
      const { l2CrossDomainMessengerMock, l2Gateway } = await setupTest(l2MessengerImpersonator);
      l2CrossDomainMessengerMock.smocked.xDomainMessageSender.will.return.with(() => user2.address);

      await expect(
        l2Gateway.connect(l2MessengerImpersonator).finalizeDeposit(user1.address, depositAmount),
      ).to.be.revertedWith(errorMessages.invalidXDomainMessageOriginator);
    });
  });

  describe('withdraw', () => {
    const withdrawAmount = 100;

    it('sends xchain message and burns tokens', async () => {
      const [_, l2MessengerImpersonator, user1] = await ethers.getSigners();
      const { l2TON, l1GatewayMock, l2CrossDomainMessengerMock, l2Gateway } = await setupWithdrawTest(
        l2MessengerImpersonator,
        user1,
      );

      await l2Gateway.connect(user1).withdraw(withdrawAmount);
      const withdrawCallToMessengerCall = l2CrossDomainMessengerMock.smocked.sendMessage.calls[0];

      expect(await l2TON.balanceOf(user1.address)).to.equal(INITIAL_TOTAL_L1_SUPPLY - withdrawAmount);
      expect(await l2TON.totalSupply()).to.equal(INITIAL_TOTAL_L1_SUPPLY - withdrawAmount);

      expect(withdrawCallToMessengerCall._target).to.equal(l1GatewayMock.address);
      expect(withdrawCallToMessengerCall._message).to.equal(
        l1GatewayMock.interface.encodeFunctionData('finalizeWithdrawal', [user1.address, withdrawAmount]),
      );
    });

    it('reverts when approval is too low', async () => {
      const [_, l2MessengerImpersonator, user1, user2] = await ethers.getSigners();
      const { l2TON, l2Gateway } = await setupWithdrawTest(
        l2MessengerImpersonator,
        user1,
      );
      await l2TON.connect(user1).approve(l2Gateway.address, 0);

      await expect(l2Gateway.connect(user2).withdraw(withdrawAmount)).to.be.revertedWith(
        errorMessages.tonInsufficientBalanceToBurn,
      );
    });

    it('reverts when not enough funds', async () => {
      const [_, l2MessengerImpersonator, user1, user2] = await ethers.getSigners();
      const { l2Gateway } = await setupWithdrawTest(
        l2MessengerImpersonator,
        user1,
      );

      await expect(l2Gateway.connect(user2).withdraw(withdrawAmount)).to.be.revertedWith(
        errorMessages.tonInsufficientBalanceToBurn,
      );
    });

    it('reverts when bridge is closed', async () => {
      const [owner, l2MessengerImpersonator, user1] = await ethers.getSigners();
      const { l2Gateway } = await setupWithdrawTest(
        l2MessengerImpersonator,
        user1,
      );
      await l2Gateway.connect(owner).close();

      await expect(l2Gateway.connect(user1).withdraw(withdrawAmount)).to.be.revertedWith(errorMessages.bridgeClosed);
    });
  });

  describe('withdrawTo', () => {
    const withdrawAmount = 100;

    it('sends xchain message and burns tokens', async () => {
      const [_, l2MessengerImpersonator, receiver, user1] = await ethers.getSigners();
      const { l2TON, l1GatewayMock, l2CrossDomainMessengerMock, l2Gateway } = await setupWithdrawTest(
        l2MessengerImpersonator,
        user1,
      );

      await l2Gateway.connect(user1).withdrawTo(receiver.address, withdrawAmount);
      const withdrawCallToMessengerCall = l2CrossDomainMessengerMock.smocked.sendMessage.calls[0];

      expect(await l2TON.balanceOf(user1.address)).to.equal(INITIAL_TOTAL_L1_SUPPLY - withdrawAmount);
      expect(await l2TON.totalSupply()).to.equal(INITIAL_TOTAL_L1_SUPPLY - withdrawAmount);

      expect(withdrawCallToMessengerCall._target).to.equal(l1GatewayMock.address);
      expect(withdrawCallToMessengerCall._message).to.equal(
        l1GatewayMock.interface.encodeFunctionData('finalizeWithdrawal', [receiver.address, withdrawAmount]),
      );
    });

    it('reverts when approval is too low', async () => {
      const [_, l2MessengerImpersonator, receiver, user1, user2] = await ethers.getSigners();
      const { l2TON, l2Gateway } = await setupWithdrawTest(
        l2MessengerImpersonator,
        user1,
      );
      await l2TON.connect(user1).approve(l2Gateway.address, 0);

      await expect(l2Gateway.connect(user2).withdrawTo(receiver.address, withdrawAmount)).to.be.revertedWith(
        errorMessages.tonInsufficientBalanceToBurn,
      );
    });

    it('reverts when not enough funds', async () => {
      const [_, l2MessengerImpersonator, receiver, user1, user2] = await ethers.getSigners();
      const { l2Gateway } = await setupWithdrawTest(
        l2MessengerImpersonator,
        user1,
      );

      await expect(l2Gateway.connect(user2).withdrawTo(receiver.address, withdrawAmount)).to.be.revertedWith(
        errorMessages.tonInsufficientBalanceToBurn,
      );
    });

    it('reverts when bridge is closed', async () => {
      const [owner, l2MessengerImpersonator, user1] = await ethers.getSigners();
      const { l2Gateway } = await setupWithdrawTest(
        l2MessengerImpersonator,
        user1,
      );
      await l2Gateway.connect(owner).close();

      await expect(l2Gateway.connect(user1).withdrawTo(user1.address, withdrawAmount)).to.be.revertedWith(
        errorMessages.bridgeClosed,
      );
    });
  });

  describe('init', () => {
    it('sets token gateway', async () => {
      const [acc1, acc2, acc3] = await ethers.getSigners();
      const l2Gateway = await deploy('L2Gateway', [acc1.address, acc2.address]);

      await l2Gateway.init(acc3.address);

      expect(await l2Gateway.l1TokenGateway()).to.eq(acc3.address);
    });

    it('allows initialization once not multiple times', async () => {
      const [acc1, acc2, acc3] = await ethers.getSigners();
      const l2Gateway = await deploy('L2Gateway', [acc1.address, acc2.address]);

      await l2Gateway.init(acc3.address);

      await expect(l2Gateway.init(acc3.address)).to.be.revertedWith(errorMessages.alreadyInitialized);
    });

    it('doesn\'t allow calls to onlyInitialized functions before initialization', async () => {
      const [acc1, acc2, acc3] = await ethers.getSigners();

      const l2Gateway = await deploy('L2Gateway', [acc1.address, acc2.address]);

      await expect(l2Gateway.withdraw('100')).to.be.revertedWith(errorMessages.notInitialized);
      await expect(l2Gateway.withdrawTo(acc3.address, '100')).to.be.revertedWith(errorMessages.notInitialized);
      await expect(l2Gateway.finalizeDeposit(acc3.address, '100')).to.be.revertedWith(errorMessages.notInitialized);
    });
  });

  describe('close()', () => {
    it('can be called by owner', async () => {
      const [owner, l2MessengerImpersonator, user1] = await ethers.getSigners();
      const { l2Gateway } = await setupTest(
        l2MessengerImpersonator,
        user1,
      );

      expect(await l2Gateway.isOpen()).to.be.eq(true);
      await l2Gateway.connect(owner).close();

      expect(await l2Gateway.isOpen()).to.be.eq(false);
    });

    it('can be called multiple times by the owner but nothing changes', async () => {
      const [owner, l2MessengerImpersonator, user1] = await ethers.getSigners();
      const { l2Gateway } = await setupTest(
        l2MessengerImpersonator,
        user1,
      );

      await l2Gateway.connect(owner).close();
      expect(await l2Gateway.isOpen()).to.be.eq(false);

      await l2Gateway.connect(owner).close();
      expect(await l2Gateway.isOpen()).to.be.eq(false);
    });

    it('reverts when called not by the owner', async () => {
      const [_owner, l2MessengerImpersonator, user1] = await ethers.getSigners();
      const { l2Gateway } = await setupTest(
        l2MessengerImpersonator,
        user1,
      );

      await expect(l2Gateway.connect(user1).close()).to.be.revertedWith(errorMessages.notOwner);
    });
  });
});

async function setupTest (l2MessengerImpersonator) {
  const l2CrossDomainMessengerMock = await deployMock(
    'OVM_L2CrossDomainMessenger',
    l2MessengerImpersonator.address,
  );
  const l2TON = await deploy('L2TON');
  const l2Gateway = await deploy('L2Gateway', [l2CrossDomainMessengerMock.address, l2TON.address]);
  const l1GatewayMock = await deployMock('L1Gateway');

  await l2TON.rely(l2Gateway.address);
  await l2Gateway.init(l1GatewayMock.address);

  return { l2TON, l1GatewayMock, l2CrossDomainMessengerMock, l2Gateway };
}

const INITIAL_TOTAL_L1_SUPPLY = 3000;

async function setupWithdrawTest (l2MessengerImpersonator, user1) {
  const contracts = await setupTest(l2MessengerImpersonator);

  await contracts.l2TON.mint(user1.address, INITIAL_TOTAL_L1_SUPPLY);
  await contracts.l2TON.connect(user1).approve(contracts.l2Gateway.address, ethers.constants.MaxUint256);

  return contracts;
}

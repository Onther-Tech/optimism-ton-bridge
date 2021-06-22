const { expect } = require('chai');
const { ethers } = require('hardhat');
const { deploy, deployMock, deployed } = require('../helpers');

const errorMessages = {
  invalidMessenger: 'OVM_XCHAIN: messenger contract unauthenticated',
  invalidXDomainMessageOriginator: 'OVM_XCHAIN: wrong sender of cross-domain message',
  alreadyInitialized: 'Contract has already been initialized',
  notInitialized: 'Contract has not yet been initialized',
  notOwner: 'L2Gateway/not-authorized',
  insufficientBalanceToBurn: 'ERC20: burn amount exceeds balance',
};

const initialTotalSupply = 3000;

describe('L2Gateway', () => {
  describe('finalizeDeposit', () => {
    const depositAmount = 100;

    it('mints new tokens', async () => {
      const [deployer, l2MessengerImpersonator, user1] = await ethers.getSigners();
      const { l1GatewayMock, l2CrossDomainMessengerMock, l2Gateway, l2Token } =
        await setupTest(deployer, l2MessengerImpersonator);

      l2CrossDomainMessengerMock.smocked.xDomainMessageSender.will.return.with(() => l1GatewayMock.address);

      await l2Gateway.connect(l2MessengerImpersonator).finalizeDeposit(user1.address, depositAmount);

      expect(await l2Token.balanceOf(user1.address)).to.be.eq(depositAmount);
      expect(await l2Token.totalSupply()).to.be.eq(depositAmount);
    });

    it('reverts when called not by XDomainMessenger', async () => {
      const [deployer, l2MessengerImpersonator, user1, user2] = await ethers.getSigners();
      const { l1GatewayMock, l2CrossDomainMessengerMock, l2Gateway } =
        await setupTest(deployer, l2MessengerImpersonator);
      l2CrossDomainMessengerMock.smocked.xDomainMessageSender.will.return.with(() => l1GatewayMock.address);

      await expect(l2Gateway.connect(user2).finalizeDeposit(user1.address, depositAmount)).to.be.revertedWith(
        errorMessages.invalidMessenger,
      );
    });

    it('reverts when called by XDomainMessenger but not relying message from l1ERC20Gateway', async () => {
      const [deployer, l2MessengerImpersonator, user1, user2] = await ethers.getSigners();
      const { l2CrossDomainMessengerMock, l2Gateway } = await setupTest(deployer, l2MessengerImpersonator);
      l2CrossDomainMessengerMock.smocked.xDomainMessageSender.will.return.with(() => user2.address);

      await expect(
        l2Gateway.connect(l2MessengerImpersonator).finalizeDeposit(user1.address, depositAmount),
      ).to.be.revertedWith(errorMessages.invalidXDomainMessageOriginator);
    });
  });

  describe('withdraw', () => {
    const withdrawAmount = 100;

    it('sends xchain message and burns tokens', async () => {
      const [deployer, l2MessengerImpersonator] = await ethers.getSigners();
      const { l1GatewayMock, l2CrossDomainMessengerMock, l2Gateway, l2Token } = await setupWithdrawTest(
        deployer,
        l2MessengerImpersonator,
      );

      await l2Gateway.connect(deployer).withdraw(withdrawAmount);
      const withdrawCallToMessengerCall = l2CrossDomainMessengerMock.smocked.sendMessage.calls[0];

      expect(await l2Token.balanceOf(deployer.address)).to.equal(initialTotalSupply - withdrawAmount);
      expect(await l2Token.totalSupply()).to.equal(initialTotalSupply - withdrawAmount);

      expect(withdrawCallToMessengerCall._target).to.equal(l1GatewayMock.address);
      expect(withdrawCallToMessengerCall._message).to.equal(
        l1GatewayMock.interface.encodeFunctionData('finalizeWithdrawal', [deployer.address, withdrawAmount]),
      );
    });

    it('reverts when approval is too low', async () => {
      const [deployer, l2MessengerImpersonator, user1, user2] = await ethers.getSigners();
      const { l2Token, l2Gateway } = await setupWithdrawTest(
        deployer,
        l2MessengerImpersonator,
      );
      await l2Token.connect(user1).approve(l2Gateway.address, 0);

      await expect(l2Gateway.connect(user2).withdraw(withdrawAmount)).to.be.revertedWith(
        errorMessages.insufficientBalanceToBurn,
      );
    });

    it('reverts when not enough funds', async () => {
      const [deployer, l2MessengerImpersonator, user1] = await ethers.getSigners();
      const { l2Gateway } = await setupWithdrawTest(
        deployer,
        l2MessengerImpersonator,
      );

      await expect(l2Gateway.connect(user1).withdraw(withdrawAmount)).to.be.revertedWith(
        errorMessages.insufficientBalanceToBurn,
      );
    });
  });

  describe('withdrawTo', () => {
    const withdrawAmount = 100;

    it('sends xchain message and burns tokens', async () => {
      const [deployer, l2MessengerImpersonator, receiver] = await ethers.getSigners();
      const { l2Token, l1GatewayMock, l2CrossDomainMessengerMock, l2Gateway } = await setupWithdrawTest(
        deployer,
        l2MessengerImpersonator,
      );

      await l2Gateway.connect(deployer).withdrawTo(receiver.address, withdrawAmount);
      const withdrawCallToMessengerCall = l2CrossDomainMessengerMock.smocked.sendMessage.calls[0];

      expect(await l2Token.balanceOf(deployer.address)).to.equal(initialTotalSupply - withdrawAmount);
      expect(await l2Token.totalSupply()).to.equal(initialTotalSupply - withdrawAmount);

      expect(withdrawCallToMessengerCall._target).to.equal(l1GatewayMock.address);
      expect(withdrawCallToMessengerCall._message).to.equal(
        l1GatewayMock.interface.encodeFunctionData('finalizeWithdrawal', [receiver.address, withdrawAmount]),
      );
    });

    it('reverts when approval is too low', async () => {
      const [deployer, l2MessengerImpersonator, receiver, user1, user2] = await ethers.getSigners();
      const { l2Token, l2Gateway } = await setupWithdrawTest(
        deployer,
        l2MessengerImpersonator,
      );
      await l2Token.connect(user1).approve(l2Gateway.address, 0);

      await expect(l2Gateway.connect(user2).withdrawTo(receiver.address, withdrawAmount)).to.be.revertedWith(
        errorMessages.insufficientBalanceToBurn,
      );
    });

    it('reverts when not enough funds', async () => {
      const [deployer, l2MessengerImpersonator, receiver, user1] = await ethers.getSigners();
      const { l2Gateway } = await setupWithdrawTest(
        deployer,
        l2MessengerImpersonator,
      );

      await expect(l2Gateway.connect(user1).withdrawTo(receiver.address, withdrawAmount)).to.be.revertedWith(
        errorMessages.insufficientBalanceToBurn,
      );
    });
  });

  describe('init', () => {
    it('sets token gateway', async () => {
      const [acc1, acc2] = await ethers.getSigners();
      const l2Gateway = await deploy('L2Gateway', [acc1.address, 'ERC20 Token Layer 2', 'TOKEN-L2']);

      await l2Gateway.init(acc2.address);

      expect(await l2Gateway.l1TokenGateway()).to.eq(acc2.address);
    });

    it('allows initialization once not multiple times', async () => {
      const [acc1, acc2] = await ethers.getSigners();
      const l2Gateway = await deploy('L2Gateway', [acc1.address, 'ERC20 Token Layer 2', 'TOKEN-L2']);

      await l2Gateway.init(acc2.address);

      await expect(l2Gateway.init(acc2.address)).to.be.revertedWith(errorMessages.alreadyInitialized);
    });

    it('doesn\'t allow calls to onlyInitialized functions before initialization', async () => {
      const [acc1, acc2] = await ethers.getSigners();

      const l2Gateway = await deploy('L2Gateway', [acc1.address, 'ERC20 Token Layer 2', 'TOKEN-L2']);

      await expect(l2Gateway.withdraw('100')).to.be.revertedWith(errorMessages.notInitialized);
      await expect(l2Gateway.withdrawTo(acc2.address, '100')).to.be.revertedWith(errorMessages.notInitialized);
      await expect(l2Gateway.finalizeDeposit(acc2.address, '100')).to.be.revertedWith(errorMessages.notInitialized);
    });
  });
});

async function setupTest (deployer, l2MessengerImpersonator) {
  const l2CrossDomainMessengerMock = await deployMock(
    'OVM_L2CrossDomainMessenger',
    l2MessengerImpersonator.address,
  );
  const l2Gateway =
    await deploy('L2Gateway', [l2CrossDomainMessengerMock.address, 'ERC20 Token Layer 2', 'TOKEN-L2']);
  const l2Token = await deployed('L2Token', (await l2Gateway.token()), deployer);
  const l1GatewayMock = await deployMock('L1Gateway');

  await l2Gateway.init(l1GatewayMock.address);

  return { l1GatewayMock, l2CrossDomainMessengerMock, l2Gateway, l2Token };
}

async function setupWithdrawTest (deployer, l2MessengerImpersonator) {
  const l2CrossDomainMessengerMock = await deployMock(
    'OVM_L2CrossDomainMessenger',
    l2MessengerImpersonator.address,
  );
  const l2Gateway =
    await deploy('L2GatewayMock', [l2CrossDomainMessengerMock.address, 'ERC20 Token Layer 2', 'TOKEN-L2']);
  const l2Token = await deployed('L2Token', (await l2Gateway.token()), deployer);
  const l1GatewayMock = await deployMock('L1Gateway');

  await l2Gateway.init(l1GatewayMock.address);

  return { l1GatewayMock, l2CrossDomainMessengerMock, l2Gateway, l2Token };
}

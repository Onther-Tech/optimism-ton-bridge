const { expect } = require('chai');
const { ethers } = require('hardhat');
const { deploy } = require('../helpers');

const errorMessages = {
  notAuthorized: 'L1Escrow/not-authorized',
};

const parseCreatedEvent = async function (tx) {
  const abi = [
    'event Created(address indexed l1Gateway)',
  ];
  const iface = new ethers.utils.Interface(abi);

  const resolvedTx = await tx.wait();
  const log = resolvedTx.logs.find((log) => {
    try {
      const pLog = iface.parseLog(log);
      return !!pLog.args.l1Gateway;
    } catch (err) {
      return false;
    }
  });

  return log ? iface.parseLog(log).args.l1Gateway : false;
};

describe('GatewayFactory', () => {
  describe('create', () => {
    it('deploys l1 gateway, register gateways and approve', async () => {
      const [_, l2Gateway, l1Messenger ] = await ethers.getSigners();
      const { l1Escrow, l1GatewayFactory, l1GatewayRegistry, l1ERC20 } = await setupTest();

      await l1Escrow.rely(l1GatewayFactory.address);

      const tx =
        await l1GatewayFactory.create(l1ERC20.address, l2Gateway.address, l1Messenger.address, l1Escrow.address);
      const l1Gateway = await parseCreatedEvent(tx);

      expect(
        await l1GatewayRegistry.registered(l1Gateway, l2Gateway.address),
      ).to.be.eq(true);
      expect(await l1ERC20.allowance(l1Escrow.address, l1Gateway)).to.be.eq(ethers.constants.MaxUint256);
    });

    it('reverts when escrow doesn\'t rely l1 gateway', async () => {
      const [_, l1ERC20, l2Gateway, l1Messenger ] = await ethers.getSigners();
      const { l1Escrow, l1GatewayFactory } = await setupTest();

      await expect(l1GatewayFactory.create(l1ERC20.address, l2Gateway.address, l1Messenger.address, l1Escrow.address))
        .to.be.revertedWith(
          errorMessages.notAuthorized,
        );
    });

    it('close', async () => {
      // TODO
    });
  });
});

async function setupTest () {
  const l1ERC20 = await deploy('L1TON');
  const l1Escrow = await deploy('L1Escrow');
  const l1GatewayRegistry = await deploy('L1GatewayRegistry');
  const l1GatewayFactory = await deploy('L1GatewayFactory', [l1GatewayRegistry.address]);

  return { l1Escrow, l1GatewayFactory, l1GatewayRegistry, l1ERC20 };
}

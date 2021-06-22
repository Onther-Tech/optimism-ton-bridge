const { ethers } = require('hardhat');
const { deploy, deployMock } = require('../helpers');

const amount = 1000;

describe('L1GatewayOnApprove', () => {
  it('onApprove', async () => {
    const [deployer, l1MessengerImpersonator] = await ethers.getSigners();
    const {
      l1GatewayOnApprove,
      l1Gateway,
      l1TON,
      l2GatewayMock,
    } = await setupTest(deployer, l1MessengerImpersonator);

    const data = dataOnApprove(l1Gateway.address, l2GatewayMock.address);
    await l1TON.connect(deployer).approve(l1GatewayOnApprove.address, amount);
    await l1TON.connect(deployer).approveAndCall(l1GatewayOnApprove.address, amount, data);
  });
});

function dataOnApprove (l1Gateway, l2Gateway) {
  const abi = [
    'function f(address from, address to)',
  ];
  const iface = new ethers.utils.Interface(abi);

  const dataWithSelector = iface.encodeFunctionData('f', [
    l1Gateway, l2Gateway,
  ]);
  const data = ethers.utils.hexDataSlice(dataWithSelector, 4);
  return data;
}

async function setupTest (
  deployer,
  l1MessengerImpersonator,
) {
  const l2GatewayMock = await deployMock('L2Gateway');
  const l1CrossDomainMessengerMock = await deployMock(
    'OVM_L1CrossDomainMessenger',
    l1MessengerImpersonator.address,
  );
  const l1TON = await deploy('L1TON');
  const l1Escrow = await deploy('L1Escrow');
  const l1Gateway = await deploy('L1Gateway', [
    l1TON.address,
    l2GatewayMock.address,
    l1CrossDomainMessengerMock.address,
    l1Escrow.address,
  ]);
  const l1GatewayRegistry = await deploy('L1GatewayRegistry');
  const l1GatewayOnApprove = await deploy('L1GatewayOnApprove', [l1TON.address, l1GatewayRegistry.address]);

  await l1Escrow.approve(l1TON.address, l1Gateway.address, ethers.constants.MaxUint256);
  await l1GatewayRegistry.register(l1Gateway.address, l2GatewayMock.address);
  await l1TON.mint(deployer.address, amount);

  return { l1GatewayOnApprove, l1Gateway, l1TON, l2GatewayMock };
}

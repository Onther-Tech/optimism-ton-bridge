require('@eth-optimism/hardhat-ovm');
require('@nomiclabs/hardhat-waffle');
require('dotenv').config();

const DEPLOYER_PRIV_KEY = process.env.L1_DEPLOYER_PRIV_KEY;

module.exports = {
  solidity: '0.7.6',
  ovm: {
    solcVersion: '0.7.6',
  },
  networks: {
    rinkeby: {
      url: 'https://rinkeby.rpc.tokamak.network',
      accounts: [`0x${DEPLOYER_PRIV_KEY}`],
    },
    optimism: {
      url: 'https://testnet1.optimism.tokamak.network',
      ovm: true,
    },
  },
  mocha: {
    timeout: 60000,
  },
};

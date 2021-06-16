require('@eth-optimism/hardhat-ovm');
require('@nomiclabs/hardhat-waffle');
require('dotenv').config();

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const KOVAN_DEPLOYER_PRIV_KEY = process.env.KOVAN_DEPLOYER_PRIV_KEY;
const RINKEBY_DEPLOYER_PRIV_KEY = process.env.RINKEBY_DEPLOYER_PRIV_KEY;

module.exports = {
  solidity: '0.7.6',
  ovm: {
    solcVersion: '0.7.6',
  },
  networks: {
    kovan: {
      url: `https://eth-kovan.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
      accounts: [`0x${KOVAN_DEPLOYER_PRIV_KEY}`],
    },
    rinkeby: {
      url: 'https://rinkeby.rpc.tokamak.network',
      accounts: [`0x${RINKEBY_DEPLOYER_PRIV_KEY}`],
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

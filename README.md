# optimism-ton-bridge

optimism-ton-bridge contract is a contract that can transfer TON between layer 1 and layer 2 (*forked from [makerdao/optimism-dai-bridge](https://github.com/makerdao/optimism-dai-bridge)*).

## Contracts

- `L1Gateway.sol` - L1 side of the bridge. Escrows L1 TON in L1Escrow contract. Unlocks L1 TON upon withdrawal message from L2Gateway.
- `L2Gateway.sol` - L2 side of the bridge. Mints new L2 TON after receiving a message from L1Gateway. Burns L2 TON tokens when withdrawals happen.
- `L1Escrow` - Holds funds on L1. Allows having many bridges coexist on L1 and share liquidity.
- `L1GatewayRegistry` - Manages l1 gateway and l2 gateway pair.

## Scrips

These scrips require valid .env file. Copy .env.example as .env and fill it out.

- `scripts/deployKovan.js` - deploys a full solution to kovan and optimism testnet on kovan. Run with `npm run deploy:kovan`

## Running

```
npm install
npm run test
```

## Deployments

### Mainnet

### Rinkeby

### Kovan

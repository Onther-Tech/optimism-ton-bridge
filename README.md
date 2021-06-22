# optimism-ton-bridge
Optimism TON and upgradable TON bridge (*forked from [makerdao/optimism-dai-bridge](https://github.com/makerdao/optimism-dai-bridge)*)

## Contracts

- `L1Gateway.sol` - L1 side of the bridge. Escrows L1 TON in L1Escrow contract. Unlocks L1 TON upon withdrawal message from L2Gateway.
- `L2Gateway.sol` - L2 side of the bridge. Mints new L2 TON after receiving a message from L1Gateway. Burns L2 TON tokens when withdrawals happen.
- `L1Escrow` - Holds funds on L1. Allows having many bridges coexist on L1 and share liquidity.
- `L1GatewayRegistry` - Manages l1 gateway and l2 gateway pair.
- `L1GatewayFactory` - Deploys l1 gateway and finishes setting up.

## Scrips

These scrips require valid `.env` file. Copy `.env.example` as `.env` and fill it out.

- `scripts/deploy.js` - deploys a full solution to rinkeby and optimism testnet on rinkeby. Run with `npm run deploy:rinkeby`
- `scripts/deposit.js` - deposit token from layer 1(rinkeby) into layer 2. Run with `npm run deposit:rinkeby`
- `scripts/withdraw.js` - withdraw token from layer 2 into layer 1(rinkeby). Run with `npm run withdraw:rinkeby`

## Running

```
npm install
npm run test
```

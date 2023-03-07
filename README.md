# Venom linear vesting contract

## Table of Contents

- [About](#about)
- [Getting Started](#getting-started)
- [Audit](#audit)

## About

### Contracts
#### VestingFactory
Contract-factory, that is responsible for deploying **Vesting** contracts.
Could be used by anyone. Require `user`, `token`, `vesting amount`, `vesting start` and `vesting end`
parameters for creating new instance of **Vesting** contract.
Emits `NewVesting` event on new contract successful deploy.
#### Vesting
Contract, that is responsible for vesting `vesting amount` of specified `tokens` for certain `user`.
Tokens are unlocked linearly every second from `vesting start` to `vesting end` and could be claimed any time.
Contract should be deposited with `vesting amount` tokens by one transfer, otherwise deposit will be reverted
and tokens will be sent back. Events are emitted on all actions including reverted deposit.

## Getting Started
### Commands
#### Deploy
```bash
# network - local|testnet|mainnet
npx locklift run --network testnet --script script/1-deploy-factory.ts
```
#### Compile
```bash
npx locklift build
```

#### Verify
```bash
npx everscan-verify --api-url https://verify.venomscan.com verify -i ./ --license 'AGPL-3.0' --compiler-version bbbbeca6e6f22f9a2cd3f30021ca83aac1a1428d --linker-version 0.15.35 -I node_modules
```

# Venom linear vesting contract
## Contracts
### VestingFactory
Contract-factory, that is responsible for deploying **Vesting** contracts.
Could be used by anyone. Require `user`, `token`, `vesting amount`, `vesting start` and `vesting end`
parameters for creating new instance of **Vesting** contract.
Emits `NewVesting` event on new contract successful deploy.
### Vesting
Contract, that is responsible for vesting `vesting amount` of specified `tokens` for certain `user`.
Tokens are unlocked linearly every second from `vesting start` to `vesting end` and could be claimed any time.
Contract should be deposited with `vesting amount` tokens by one transfer, otherwise deposit will be reverted
and tokens will be sent back. Events are emitted on all actions including reverted deposit.
## Commands
#### Deploy
```
// local is used by default
locklift run --network local --script script/1-deploy-factory.ts
```
#### Compile
```
npx locklift build
```


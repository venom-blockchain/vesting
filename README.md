# Venom linear vesting contract

## Table of Contents

- [Venom linear vesting contract](#venom-linear-vesting-contract)
  - [Table of Contents](#table-of-contents)
  - [About](#about)
    - [Contracts](#contracts)
      - [VestingFactory](#vestingfactory)
      - [Vesting](#vesting)
    - [Call chain diagrams](#call-chain-diagrams)
      - [Vesting](#vesting-1)
      - [Native Vesting](#native-vesting)
  - [Getting Started](#getting-started)
    - [Commands](#commands)
      - [Test](#test)
      - [Deploy](#deploy)
      - [Compile](#compile)
      - [Verify](#verify)
  - [Audits](#audits)

## About

### Contracts

#### VestingFactory

Contract factory is responsible for deploying **Vesting** contracts.
Could be used by anyone. Require `user`, `token`, `remainingGasTo`, `vesting amount`, `vesting start` and `vesting end`
parameters for creating new instance of **Vesting** contract.
Emits `NewVesting` event on new contract successful deploy. Creates indexes for each vesting contract.

**VestingFactory** inherits from **IndexFactory** and deploys indexes to each Vesting contract.

Indexes are used to look up contracts for a specific creator, recipient, and token by a hash code that can be obtained off-chain. See `./script/2-indexing-example.ts` for an example of how to use indexes.

#### Vesting

Contract, that is responsible for vesting `vesting amount` of specified `tokens` for certain `user`.
Tokens are unlocked linearly every second from `vesting start` to `vesting end` and could be claimed at any time.
Vesting contract should be deposited with `vesting amount` tokens by one transfer, otherwise, a deposit will be reverted
and tokens will be sent back. Events are emitted on all actions including reverted deposit.


### Call chain diagrams

#### Vesting

```mermaid
sequenceDiagram
    title Vesting deployment call chain
    participant External
    participant Wallet
    participant VestingFactory
    participant Vesting
    participant TokenRoot
    participant VestingTokenWallet
    participant RecipientTokenWallet
    participant RecipientIndex
    participant CreatorIndex
    participant TokenIndex

    External->>Wallet: sendTransaction()
    Wallet->>VestingFactory: deployVesting(ARGS, VALUE, FLAG:0, BOUNCE: false)
    activate VestingFactory
    VestingFactory-->>VestingFactory: Validate ARGS & VALUE
    deactivate VestingFactory
    alt ARGS or VALUE is INVALID
        VestingFactory-->>Wallet: Revert transaction and return error code and all remaining value
    else ARGS & VALUE are VALID
        activate VestingFactory
        VestingFactory-->>VestingFactory: Reserve CONTRACT_MIN_BALANCE to avoid balance leakage
        VestingFactory->>Vesting: new Vesting(ARGS, VALUE, FLAG:128, BOUNCE: false) <br>// create new contract and send remaining value
        deactivate VestingFactory
        activate Vesting
        Vesting->>Vesting: Reserve CONTRACT_MIN_BALANCE
        Vesting->>TokenRoot: deployWallet(VALUE:TOKEN_WALLET_DEPLOY_VALUE, FLAG:128, BOUNCE: false)<br>// VestingTokenWallet
        TokenRoot->>VestingTokenWallet: onDeployRetry(VALUE, FLAG:128, BOUNCE: false)
        VestingTokenWallet->>VestingTokenWallet: reserve CONTRACT_MIN_BALANCE
        VestingTokenWallet->>Vesting: transfer(FLAG:128, BOUNCE: false) <br>// transfer remaining value
        TokenRoot->>RecipientTokenWallet: onDeployRetry(VALUE, FLAG:128, BOUNCE: false)
        RecipientTokenWallet->>RecipientTokenWallet: reserve CONTRACT_MIN_BALANCE
        RecipientTokenWallet->>Vesting: transfer(FLAG:128, BOUNCE: false) <br>// transfer remaining value
        Vesting->>TokenRoot: deployWallet(VALUE:TOKEN_WALLET_DEPLOY_VALUE, FLAG:128, BOUNCE: false) <br>// RecipientTokenWallet
        Vesting->>VestingFactory: onVestingDeployed(ARGS, VALUE, FLAG:128,BOUNCE: false)
        deactivate Vesting
        activate VestingFactory
        VestingFactory-->>VestingFactory: Reserve CONTRACT_MIN_BALANCE to avoid balance leakage
        VestingFactory->>RecipientIndex: deployUserIndex(VALUE:CONTRACT_MIN_BALANCE, FLAG:0, BOUNCE: false)
        VestingFactory->>CreatorIndex: deployUserIndex(VALUE:CONTRACT_MIN_BALANCE, FLAG:0, BOUNCE: false)
        VestingFactory->>TokenIndex: deployUserIndex(VALUE:CONTRACT_MIN_BALANCE, FLAG:0, BOUNCE: false)
        VestingFactory->>Wallet: transfer(FLAG:128, BOUNCE: false) <br>// transfer remaining value
        deactivate VestingFactory
    end
```

#### Native Vesting
```mermaid
sequenceDiagram
    title Native Vesting deployment call chain
    participant External
    participant Wallet
    participant VestingFactory
    participant NativeVesting
    participant RecipientIndex
    participant CreatorIndex

    External->>Wallet: sendTransaction()
    Wallet->>VestingFactory: deployNativeVesting(ARGS, VALUE, FLAG:0, BOUNCE: false)
    activate VestingFactory
    VestingFactory-->>VestingFactory: Validate ARGS & VALUE
    deactivate VestingFactory
    alt ARGS or VALUE is INVALID
        VestingFactory-->>Wallet: Revert transaction and return error code and all remaining value
    else ARGS & VALUE are VALID
        activate VestingFactory
        VestingFactory-->>VestingFactory: Reserve CONTRACT_MIN_BALANCE to avoid balance leakage
        VestingFactory->>NativeVesting: new NativeVesting(ARGS, VALUE, FLAG:128, BOUNCE: false) <br>// create new contract and send remaining value
        deactivate VestingFactory
        activate NativeVesting
        NativeVesting->>NativeVesting: Reserve CONTRACT_MIN_BALANCE
        NativeVesting->>VestingFactory: onVestingDeployed(ARGS, VALUE, FLAG:128,BOUNCE: false)
        deactivate NativeVesting
        activate VestingFactory
        VestingFactory-->>VestingFactory: Reserve CONTRACT_MIN_BALANCE to avoid balance leakage
        VestingFactory->>RecipientIndex: deployUserIndex(VALUE:CONTRACT_MIN_BALANCE, FLAG:0, BOUNCE: false)
        VestingFactory->>CreatorIndex: deployUserIndex(VALUE:CONTRACT_MIN_BALANCE, FLAG:0, BOUNCE: false)
        VestingFactory->>Wallet: transfer(FLAG:128, BOUNCE: false) <br>// transfer remaining value
        deactivate VestingFactory
    end
```



## Getting Started

### Commands

#### Test

```bash
npx locklift test --network local -t test --tests test/1-main.ts
npx locklift test --network local -t test --tests test/2-native-main.ts
npx locklift test --network local -t test --tests test/3-indexer.ts
```

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
npx everscan-verify --api-url https://verify.venomscan.com verify -i ./ --license 'AGPL-3.0' --compiler-version bbbbeca6e6f22f9a2cd3f30021ca83aac1a1428d --linker-version 0.15.48 -I node_modules
```

## Audits

Security Assessment by [Certik](https://github.com/venom-blockchain/vesting/blob/main/audits/certik/audit.pdf)

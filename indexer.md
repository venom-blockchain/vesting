# On-chain contract indexing

In the Venom blockchain ecosystem, a widely used approach involves searching for contracts with identical code based on their hash. This method proves particularly valuable when there is a need to locate all contracts of the same type.

Furthermore, we can enhance this technique by adding a salt to the contract code, thus creating a unique code hash. This allows us to identify subsets of contracts that share the same code hash.

This approach is detailed in TIP4-3, the ONCHAIN Indexing standard.

Expanding on this concept, we can deploy index contracts that are salted in a specific manner. By knowing the original code of the index contract and the salting parameters, we can calculate the code hash of the target contracts off-chain. Subsequently, this code hash can be employed to retrieve all contracts that match the criteria with a single request.

In this context, we create an Indexer contract for the Vesting factory and generate indexes for each vesting contract.

## Contract

### Indexer

```sol
pragma ever-solidity >=0.62.0;

interface IIndexer {
  // The deployIndex method is responsible for the deployment of a new index contract. It takes as parameters the address of the vestingContract, the acc address used for indexing, the indexType which signifies the type of the index (0 for RECIPIENT, 1 for CREATOR, 2 for TOKEN), and the vestingContractType to differentiate between the Vesting (TIP3, designated as 0) and the NativeVesting (VENOM, designated as 1) contracts.
  function deployIndex(address vestingContract, address acc, uint8 indexType, uint8 vestingContractType) external view;

  // The destructIndex method allows for the destruction of an existing index contract. This method takes two parameters: the index address which signifies the contract to be destructed, and the sendGasTo address which is the recipient of remaining funds that get freed up as a result of the destruction process.
  function destructIndex(address index, address sendGasTo) external view;

  // The getCodeIndex method is used to retrieve the code of the index contract. This method takes no parameters and returns the code of the index contract.
  function getCodeIndex() external view responsible returns (TvmCell codeIndex);

  // The resolveIndexAddress method is used to locate the address of an index contract. The method requires four parameters that include the vestingContract address, the acc address, the indexType, and the vestingContractType. Upon successful resolution, the method returns the address of the corresponding index contract
  function resolveIndexAddress(
    address vestingContract,
    address acc,
    uint8 indexType,
    uint8 vestingContractType
  ) external view responsible returns (address index);

  // The resolveIndexCodeHash method is used to calculate the code hash of an index contract. Similar to resolveIndexAddress, this method requires the acc address, the indexType, and the vestingContractType as parameters. Upon successful calculation, the method returns the code hash of the corresponding index contract.
  function resolveIndexCodeHash(
    address acc,
    uint8 indexType,
    uint8 vestingContractType
  ) external view responsible returns (uint256 codeHash);
}
```

## Index

```sol
pragma ever-solidity >=0.62.0;

interface IIndex {
    // The getInfo method is used to fetch all the associated information of the Index contract. On invocation, this method returns the address of the vestingFactory contract, the address of the vestingContract linked with the index, the acc address used for indexing, the indexType which signifies the type of the index (0 for RECIPIENT, 1 for CREATOR, 2 for TOKEN), and the vestingContractType to define vesting type (0 for TIP3, 1 for Native (VENOM)).
    function getInfo() external returns (address vestingFactory, address vestingContract, address acc, uint8 indexType, uint8 vestingContractType);

    // The getCodeHash method is utilized to compute the code hash of the Index contract. The method doesn't require any input parameters. On successful execution, it returns the code hash of the Index contract.
    function getCodeHash() external view responsible returns (uint256);

    // The destruct method facilitates the termination of the Index contract. It takes as input the gasReceiver address, which is the recipient of any remaining funds that get released during the destruction process.
    function destruct(address gasReceiver) external;
}

```

## Library

```sol
pragma ever-solidity >=0.62.0;

// This library defines the IndexType structure, which is used to uniquely identify the index of a vesting contract based on different factors. By utilizing these different factors, we can ensure that each vesting contract has a unique index, even if the recipient and creator are the same in some cases. For native vesting we will use only RECIPIENT and TOKEN indexes.
library IndexType {
    uint8 constant RECIPIENT = 0;
    uint8 constant CREATOR = 1;
    uint8 constant TOKEN = 2;
}

// This library defines the VestingContractType, which is used to differentiate between vesting contracts and native vesting contracts.
library VestingContractType {
    uint8 constant VESTING = 0;
    uint8 constant VESTING_NATIVE = 1;
}

```

## Find index contracts

To find contracts you need to calculate code hash of desired contract, you can use the getSaltedCodeHash function:

```ts
import { Address } from "locklift";

export async function getSaltedCodeHash(
  tvc: string,
  vestingFactory: Address,
  acc: Address,
  indexType: 0 | 1 | 2,
  vestingContractType: 0 | 1,
): Promise<string> {
  const { hash: saltedCodeHash } = await locklift.provider.setCodeSalt({
    code: tvc,
    salt: {
      structure: [
        { name: "_vestingFactory", type: "address" },
        { name: "_acc", type: "address" },
        { name: "_indexType", type: "uint8" },
        { name: "_vestingContractType", type: "uint8" },
      ] as const,
      abiVersion: "2.1",
      data: {
        _vestingFactory: vestingFactory,
        _acc: acc,
        _indexType: indexType,
        _vestingContractType: vestingContractType,
      },
    },
  });

  return "0x" + saltedCodeHash;
}
```

Here, the tvcCode is the TVC code of the Index contract. You can obtain this code by calling the `getCodeIndex()` method on the Indexer contract.


indexType has three possible values:

- 0 is used to find all contracts where acc is the RECIPIENT.
- 1 is used to find all contracts where acc is the CREATOR.
- 2 is used to find all contracts where acc is the TOKEN address.

vestingContractType has two possible values:

- VESTING = 0 is for Vesting contracts (TIP3).
- VESTING_NATIVE = 1 is for NativeVesting contracts (VENOM).

By using the obtained codeHash, we can find all index contracts:

```ts
const indexes = (await locklift.provider.getAccountsByCodeHash({ codeHash: indexCodeHash })).accounts;
```

Once we have the list of index contract addresses, we can get the information stored in an `Index` with the `getInfo()` method

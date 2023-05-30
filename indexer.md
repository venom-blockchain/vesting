# On-chain contract indexing

A prevalent pattern in the Venom blockchain involves searching for contracts with identical code using their hash. This method is particularly beneficial when there is a need to locate all contracts of the same type. This approach is inspired by [TIP4-3](https://docs.venom.foundation/standards/TIP/TIP-4/3/).

Expanding on this concept, we can deploy index contracts that are salted in a specific way. By knowing the original code of the index contract and the parameters used for salting, we can compute the code hash of the target contracts off-chain. This code hash can then be utilized to fetch all such contracts using a single request.
A common pattern in the Venom blockchain is to search for contracts with the same code by its hash. This can be useful if we want to find all contracts of the same type.

## Contract

### IndexFactory

```sol
pragma ever-solidity >=0.62.0;

interface IIndexer {
  // The deployIndex method is responsible for the deployment of a new index contract. It takes as parameters the address of the vestingContract, the acc address used for indexing, the indexType which signifies the type of the index (0 for RECIPIENT, 1 for CREATOR, 2 for TOKEN), and the vestingContractType to differentiate between the Vesting (TIP3, designated as 0) and the NativeVesting (VENOM, designated as 1) contracts.
  function deployIndex(address vestingContract, address acc, uint8 indexType, uint8 vestingContractType) external view;

  // The destructIndex method allows for the destruction of an existing index contract. This method takes two parameters: the index address which signifies the contract to be destructed, and the sendGasTo address which is the recipient of remaining funds that get freed up as a result of the destruction process.
  function destructIndex(address index, address sendGasTo) external view;

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

Here, the tvcCode is the TVC code of the Index contract. 

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

Once we have the list of index contract addresses, we can get the information stored in an index with the getInfo() method:

```sol
function getInfo() external returns (address vestingFactory, address vestingContract, address acc, uint8 indexType);
```


## Index Contract Artifacts

The Index contract artifacts were compiled using TVMCompiler v0.62.0 and TVM-linker v0.15.48.

### Code hash without salt

`ca30e102ba1c0f366a118d9585dfcca9db2bbb21ede36e0b1c2ec3953f6ca154`

### TVC

`te6ccgECHgEABG4ABCSK7VMg4wMgwP/jAiDA/uMC8gsbAgEdA7ztRNDXScMB+GaJ+Gkh2zzTAAGOGYMI1xgg+QEB0wABlNP/AwGTAvhC4vkQ8qiV0wAB8nri0z8B+EMhufK0IPgjgQPoqIIIG3dAoLnytPhj0x8B+CO88rnTHwHbPPI8DgsDA3rtRNDXScMB+GYi0NMD+kAw+GmpOAD4RH9vcYIImJaAb3Jtb3Nwb3T4ZNwhxwDjAiHXDR/yvCHjAwHbPPI8GhoDAiggghAtlLYSu+MCIIIQbewkcrvjAg8EAiggghBotV8/uuMCIIIQbewkcrrjAgcFAtQw+Eby4EzTH/hEWG91+GTR2zwhjhoj0NMB+kAwMcjPhyDOghDt7CRyzwuBy//JcI4y+EQgbxMhbxL4SVUCbxHIz4SAygDPhEDOAfoC9ABxzwtpAcj4RG8Vzwsfy//NyfhEbxTi+wDjAPIABhQAIvhEcG9ycG9xcW90+GT4KvkAA4Aw+EJu4wD4RvJz0fgq2zwgbvLT6SBu8n/Q+kD6QNMH1wsH+En4SscF8uBkAfhNuvLj6/gAWPhvAfhs+G7bPPIACwgXAhjQIIs4rbNYxwWKiuIJCgEK103Q2zwKAELXTNCLL0pA1yb0BDHTCTGLL0oY1yYg10rCAZLXTZIwbeICFu1E0NdJwgGOgOMNDBkElHDtRND0BXEhgED0Do6A33IigED0Do6A33MjgED0Do6A33QkgED0Dm+Rk9cLB95wifhv+G74bfhs+Gv4aoBA9A7yvdcL//hicPhjDQ0NDgECiQ4AQ4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAETiCCC6Ot17rjAiCCEA20Xcm64wIgghAmcnYGuuMCIIIQLZS2ErrjAhYSERABUDDR2zz4TiGOHI0EcAAAAAAAAAAAAAAAACtlLYSgyM7LB8lw+wDe8gAZAU4w0ds8+E8hjhuNBHAAAAAAAAAAAAAAAAApnJ2BoMjOzslw+wDe8gAZA4Yw+Eby4Ez4Qm7jANMf+ERYb3X4ZNHbPCSOKSbQ0wH6QDAxyM+HIM5xzwthXjDIz5I20XcmzlUgyM5ZyM7LB83NzclwGRUTAYyOPfhEIG8TIW8S+ElVAm8RyM+EgMoAz4RAzgH6AvQAcc8LaV4wyPhEbxXPCx/OVSDIzlnIzssHzc3NyfhEbxTi+wDjAPIAFAAo7UTQ0//TPzH4Q1jIy//LP87J7VQAKvhEcG9ycG9xcW90+GT4T/hL+Ez4TQM2MPhG8uBM+EJu4wAhk9TR0N76QNHbPDDbPPIAGRgXAFr4T/hO+E34TPhL+Er4Q/hCyMv/yz/Pg85VQMjOVTDIzssHywcByM7Nzc3J7VQAMPhJ+ErHBfLj6sjPhQjOgG/PQMmBAKD7AABg7UTQ0//TP9MAMfpA1NHQ+kDU0dD6QNMH0wfU0dD6QNH4b/hu+G34bPhr+Gr4Y/hiAAr4RvLgTAIK9KQg9KEdHAAUc29sIDAuNjIuMAAA`
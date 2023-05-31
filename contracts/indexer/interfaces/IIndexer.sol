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

pragma ever-solidity >=0.62.0;

interface IIndex {
    // The getInfo method is used to fetch all the associated information of the Index contract. On invocation, this method returns the address of the vestingFactory contract, the address of the vestingContract linked with the index, the acc address used for indexing, the indexType which signifies the type of the index (0 for RECIPIENT, 1 for CREATOR, 2 for TOKEN), and the vestingContractType to define vesting type (0 for TIP3, 1 for Native (VENOM)).
    function getInfo()
        external
        returns (
            address vestingFactory,
            address vestingContract,
            address acc,
            uint8 indexType,
            uint8 vestingContractType
        );

    // The getCodeHash method is utilized to compute the code hash of the Index contract. The method doesn't require any input parameters. On successful execution, it returns the code hash of the Index contract.
    function getCodeHash() external view responsible returns (uint256);

    // The destruct method facilitates the termination of the Index contract. It takes as input the gasReceiver address, which is the recipient of any remaining funds that get released during the destruction process.
    function destruct(address gasReceiver) external;
}

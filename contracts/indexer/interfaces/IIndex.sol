pragma ever-solidity >=0.62.0;

interface IIndex {
    function getInfo() external returns (address vestingFactory, address vestingContract, address acc, uint8 indexType);

    function getCodeHash() external view responsible returns (uint256);

    function destruct(address gasReceiver) external;
}

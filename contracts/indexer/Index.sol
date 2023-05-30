pragma ever-solidity >=0.62.0;

pragma AbiHeader expire;
pragma AbiHeader pubkey;

import "@broxus/contracts/contracts/libraries/MsgFlag.sol";

contract Index {
    address static _indexer;
    address static _vestingContract;
    address static _acc;
    uint8 static _indexType;

    uint8 public _vestingContractType;
    address public _vestingFactory;

    uint16 constant SALT_HAS_NO_VALUE = 1001;
    uint16 constant NOT_INDEXER = 1002;
    uint16 constant INCORRECT_INDEX_TYPE = 1003;

    constructor() public {
        optional(TvmCell) salt = tvm.codeSalt(tvm.code());
        require(salt.hasValue(), SALT_HAS_NO_VALUE);
        (address vestingFactory, address acc, uint8 indexType, uint8 vestingContractType) = salt.get().toSlice().decode(
            address,
            address,
            uint8,
            uint8
        );
        require(msg.sender == _indexer);
        require(indexType == _indexType, INCORRECT_INDEX_TYPE);
        tvm.accept();
        _vestingFactory = vestingFactory;
        _acc = acc;
        _vestingContractType = vestingContractType;
    }

    function getCodeHash() public pure responsible returns (uint256) {
        return { value: 0, bounce: false, flag: MsgFlag.SENDER_PAYS_FEES } tvm.hash(tvm.code());
    }

    function getInfo()
        public
        view
        responsible
        returns (
            address vestingFactory,
            address vestingContract,
            address acc,
            uint8 indexType,
            uint8 vestingContractType
        )
    {
        return
            { value: 0, bounce: false, flag: MsgFlag.SENDER_PAYS_FEES } (
                _vestingFactory,
                _vestingContract,
                _acc,
                _indexType,
                _vestingContractType
            );
    }

    function destruct(address gasReceiver) public {
        require(msg.sender == _indexer, NOT_INDEXER);
        selfdestruct(gasReceiver);
    }
}

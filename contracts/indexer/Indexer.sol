pragma ever-solidity >=0.62.0;

pragma AbiHeader expire;
pragma AbiHeader pubkey;

import "interfaces/IIndex.sol";
import "Index.sol";
import "@broxus/contracts/contracts/libraries/MsgFlag.sol";
import "library.sol";

contract Indexer {
    address static _vestingFactory;

    TvmCell _codeIndex;
    uint128 _indexDeployValue;
    uint128 _indexDestroyValue;
    address _owner;

    uint128 constant CONTRACT_MIN_BALANCE = 1 ton;

    uint16 constant WRONG_PUBKEY = 1001;
    uint16 constant NOT_VESTING_FACTORY = 1002;
    uint16 constant NOT_OWNER = 1003;

    constructor(TvmCell codeIndex, uint128 indexDeployValue, uint128 indexDestroyValue) public {
        require(tvm.pubkey() != 0, WRONG_PUBKEY);
        require(tvm.pubkey() == msg.pubkey(), WRONG_PUBKEY);
        tvm.accept();
        _codeIndex = codeIndex;
        _indexDeployValue = indexDeployValue;
        _indexDestroyValue = indexDestroyValue;
        _owner = msg.sender;
    }

    modifier onlyVestingFactory() {
        require(msg.sender == _vestingFactory, NOT_VESTING_FACTORY);
        _;
    }
    modifier onlyOwner() {
        require(msg.sender == _owner, NOT_OWNER);
        _;
    }

    function _reserve() internal pure returns (uint128) {
        return math.max(address(this).balance - msg.value, CONTRACT_MIN_BALANCE);
    }

    function deployIndex(
        address vestingContract,
        address acc,
        uint8 indexType,
        uint8 vestingContractType
    ) external view onlyVestingFactory {
        tvm.rawReserve(_reserve(), 0);
        TvmCell codeIndex = _buildIndexCode(_vestingFactory, acc, indexType, vestingContractType);
        TvmCell stateIndex = _buildIndexState(codeIndex, address(this), vestingContract, acc, indexType);
        new Index{ stateInit: stateIndex, value: _indexDeployValue, flag: MsgFlag.SENDER_PAYS_FEES }();
    }

    function destructIndex(address index, address sendGasTo) external view onlyOwner {
        IIndex(index).destruct{ value: _indexDestroyValue }(sendGasTo);
    }

    function resolveIndexAddress(
        address vestingContract,
        address acc,
        uint8 indexType,
        uint8 vestingContractType
    ) public view responsible returns (address index) {
        TvmCell code = _buildIndexCode(_vestingFactory, acc, indexType, vestingContractType);
        TvmCell state = _buildIndexState(code, address(this), vestingContract, acc, indexType);
        uint256 hashState = tvm.hash(state);
        return
            { value: 0, flag: MsgFlag.REMAINING_GAS, bounce: false } address.makeAddrStd(address(this).wid, hashState);
    }

    function resolveIndexCodeHash(
        address acc,
        uint8 indexType,
        uint8 vestingContractType
    ) public view responsible returns (uint256 codeHash) {
        TvmCell code = _buildIndexCode(_vestingFactory, acc, indexType, vestingContractType);
        return { value: 0, flag: MsgFlag.REMAINING_GAS, bounce: false } tvm.hash(code);
    }

    function _buildIndexCode(
        address vestingFactory,
        address acc,
        uint8 indexType,
        uint8 vestingContractType
    ) internal view returns (TvmCell) {
        TvmBuilder salt;
        salt.store(vestingFactory);
        salt.store(acc);
        salt.store(indexType);
        salt.store(vestingContractType);
        return tvm.setCodeSalt(_codeIndex, salt.toCell());
    }

    function _buildIndexState(
        TvmCell code,
        address indexer,
        address vestingContract,
        address acc,
        uint8 indexType
    ) internal pure returns (TvmCell) {
        return
            tvm.buildStateInit({
                contr: Index,
                varInit: { _indexer: indexer, _acc: acc, _vestingContract: vestingContract, _indexType: indexType },
                code: code
            });
    }
}

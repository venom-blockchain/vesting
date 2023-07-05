pragma ever-solidity >=0.62.0;

pragma AbiHeader expire;
pragma AbiHeader pubkey;

import "Index.sol";
import "@broxus/contracts/contracts/libraries/MsgFlag.tsol";

contract Indexer {
  // static variables
  address static _rootContract; // factory contract
  uint128 static _nonce;

  // constants
  uint128 constant CONTRACT_MIN_BALANCE = 1 Ever;

  // deploy parameters
  uint128 _indexDeployValue;
  uint128 _indexDestroyValue;

  // variables
  TvmCell _indexCode;
  address _owner;

  // errors
  uint16 constant WRONG_PUBKEY = 1001;
  uint16 constant NOT_ROOT_CONTRACT = 1002;
  uint16 constant NOT_OWNER = 1003;
  uint16 constant NOT_ROOT_CONTRACT_OR_OWNER = 1008;
  uint16 constant SALT_HAS_NO_VALUE = 1005;

  // events
  event IndexDeployed(Index.Salt saltParams, address index);

  constructor(address owner, TvmCell indexCode, uint128 indexDeployValue, uint128 indexDestroyValue) public {
    require(tvm.pubkey() != 0, WRONG_PUBKEY);
    require(tvm.pubkey() == msg.pubkey(), WRONG_PUBKEY);
    tvm.accept();
    _indexCode = indexCode;
    _indexDeployValue = indexDeployValue;
    _indexDestroyValue = indexDestroyValue;
    _owner = owner;
  }

  /// @dev Modifier to make a function callable only by the root contract.
  /// @notice This function will revert if called by any account other than the root contract.
  modifier onlyRootContract() {
    require(msg.sender == _rootContract, NOT_ROOT_CONTRACT);
    _;
  }

  /// @dev Modifier to make a function callable only by the contract's owner.
  /// @notice This function will revert if called by any account other than the owner.
  modifier onlyOwner() {
    require(msg.sender == _owner, NOT_OWNER);
    _;
  }

  /// @dev Modifier to make a function callable only by the root contract or the contract's owner.
  /// @notice This function will revert if called by any account other than the root contract or the owner.
  modifier onlyRootContractOrOwner() {
    require(msg.sender == _rootContract || msg.sender == _owner, NOT_ROOT_CONTRACT_OR_OWNER);
    _;
  }

  /// @dev Gets the index contract code.
  /// @notice This function will return the TvmCell index code of the contract.
  /// @return indexCode TvmCell representing the index code of the contract.
  function getIndexCode() public view responsible returns (TvmCell indexCode) {
    return { value: 0, flag: MsgFlag.REMAINING_GAS, bounce: false } _indexCode;
  }

  /// @dev Gets the owner of the contract.
  /// @notice This function will return the address of the owner of the contract.
  /// @return owner Address of the contract owner.
  function getOwner() public view responsible returns (address owner) {
    return { value: 0, flag: MsgFlag.REMAINING_GAS, bounce: false } _owner;
  }

  /// @dev Resolves the code hash for a Index contract instance based on provided salt parameters.
  /// @notice This function will calculate and return the code hash of the Index contract based on the provided salt parameters.
  /// @param saltParams The parameters used for the calculation of the Index contract's code hash.
  /// @return codeHash The calculated code hash for the Index contract.
  function resolveIndexCodeHash(Index.Salt[] saltParams) public view responsible returns (uint256 codeHash) {
    TvmCell salt = _buildSalt(saltParams);
    TvmCell code = _buildIndexCode(salt);
    return { value: 0, flag: MsgFlag.REMAINING_GAS, bounce: false } tvm.hash(code);
  }

  /// @dev Destroys a specified Index contract and sends its remaining gas to a specified address.
  /// @notice This function can only be called by the contract's owner and will destroy the specified Index contract.
  /// @param index The address of the Index contract to be destroyed.
  /// @param sendGasTo The address to which the remaining gas of the Index contract will be sent.
  function destructIndex(address index, address sendGasTo) internal {
    Index(index).destruct{ value: _indexDestroyValue }(sendGasTo);
  }

  /// @dev Deploys a new Index contract with given instance address and salt parameters.
  /// @notice This function can only be called by the contract's owner or the root contract.
  /// @param instance Indexed contract address
  /// @param saltParams The salt parameters for the new Index contract.
  function deployIndex(address instance, Index.Salt[] saltParams) internal {
    tvm.rawReserve(_reserve(), 0);

    TvmCell salt = _buildSalt(saltParams);

    TvmCell indexCode = _buildIndexCode(salt);

    TvmCell indexState = _buildIndexState(indexCode, saltParams, instance);
    new Index{ stateInit: indexState, value: _indexDeployValue, flag: MsgFlag.SENDER_PAYS_FEES }();
  }

  /// @dev Builds a TvmCell using the provided salt parameters.
  /// @param saltParams The salt parameters used to build the TvmCell.
  /// @return The TvmCell built using the provided salt parameters.
  function _buildSalt(Index.Salt[] saltParams) internal pure returns (TvmCell) {
    TvmBuilder salt;
    salt.store(saltParams);
    return salt.toCell();
  }

  /// @dev Builds the Index contract code using the provided salt.
  /// @param salt The TvmCell salt used to build the Index contract code.
  /// @return The TvmCell representing the Index contract code.
  function _buildIndexCode(TvmCell salt) internal view returns (TvmCell) {
    return tvm.setCodeSalt(_indexCode, salt);
  }

  /// @dev Builds the state for the Index contract using the provided code and salt parameters.
  /// @param code The TvmCell representing the Index contract code.
  /// @return The TvmCell representing the Index contract state.
  function _buildIndexState(TvmCell code, Index.Salt[] salt, address instance) internal returns (TvmCell) {
    Index.Info info = Index.Info(_rootContract, instance);
    return
      tvm.buildStateInit({ contr: Index, varInit: { _indexer: address(this), _salt: salt, _info: info }, code: code });
  }

  /// @dev Computes and returns the reserve balance of the contract.
  /// @notice This method ensures that the contract always retains a minimum balance (CONTRACT_MIN_BALANCE).
  /// @return The reserve balance of the contract.
  function _reserve() internal pure returns (uint128) {
    return math.max(address(this).balance - msg.value, CONTRACT_MIN_BALANCE);
  }
}

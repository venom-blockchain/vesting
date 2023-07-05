pragma ever-solidity >=0.62.0;

pragma AbiHeader expire;
pragma AbiHeader pubkey;

import "@broxus/contracts/contracts/libraries/MsgFlag.tsol";

library Errors {
  uint16 constant SALT_HAS_NO_VALUE = 1001;
  uint16 constant NOT_INDEXER = 1002;
}

contract Index {
  struct Info {
    address factory;
    address instance;
  }
  struct Salt {
    string key;
    string valueType;
    TvmCell value;
  }

  address static _indexer;

  Salt[] static _salt;
  Info static _info;

  constructor() public {
    optional(TvmCell) salt = tvm.codeSalt(tvm.code());
    require(salt.hasValue(), Errors.SALT_HAS_NO_VALUE);

    Salt[] decodedSalt = salt.get().toSlice().decode(Salt[]);
    require(msg.sender == _indexer);
    tvm.accept();
    _salt = decodedSalt;
  }

  function getCodeHash() public pure responsible returns (uint256) {
    return { value: 0, bounce: false, flag: MsgFlag.SENDER_PAYS_FEES } tvm.hash(tvm.code());
  }

  function getInfo() public view responsible returns (Info info) {
    return { value: 0, bounce: false, flag: MsgFlag.SENDER_PAYS_FEES } (_info);
  }

  function getSalt() public view responsible returns (Salt[] salt) {
    return { value: 0, bounce: false, flag: MsgFlag.SENDER_PAYS_FEES } (_salt);
  }

  function destruct(address gasReceiver) public {
    require(msg.sender == _indexer, Errors.NOT_INDEXER);
    selfdestruct(gasReceiver);
  }
}

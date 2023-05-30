pragma ever-solidity >=0.62.0;

library VestingContractType {
    uint8 constant VESTING = 0;
    uint8 constant VESTING_NATIVE = 1;
}

library IndexType {
    uint8 constant RECIPIENT = 0;
    uint8 constant CREATOR = 1;
    uint8 constant TOKEN = 2;
}

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

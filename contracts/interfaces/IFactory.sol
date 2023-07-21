pragma ever-solidity ^0.62.0;

interface IFactory {
    function onVestingDeployed(
        uint128 nonce,
        address user,
        address creator,
        address sendRemainingGasTo,
        address token,
        uint128 vesting_amount,
        uint32 vesting_start,
        uint32 vesting_end
    ) external;
}

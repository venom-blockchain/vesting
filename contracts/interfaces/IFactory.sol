pragma ton-solidity ^0.57.1;


interface IFactory {
    function onVestingDeployed(
        uint128 nonce,
        address user,
        address creator,
        address token,
        uint128 vesting_amount,
        uint32 vesting_start,
        uint32 vesting_end
    ) external;
}

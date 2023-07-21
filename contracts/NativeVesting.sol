pragma ever-solidity ^0.62.0;
pragma AbiHeader expire;

import "@broxus/contracts/contracts/libraries/MsgFlag.tsol";
import "interfaces/IFactory.sol";

contract NativeVesting {
    event Deposit(address sender, uint128 amount);
    event Claim(uint128 amount, uint128 remaining_amount);
    event Vested();

    uint128 static nonce;
    address static factory;

    // setup params
    address user;
    address creator;
    uint128 vestingAmount;
    uint32 vestingStart;
    uint32 vestingEnd;

    uint32 lastClaimTime;
    uint128 balance;
    bool filled;
    bool vested;

    uint16 constant NOT_USER = 1001;
    uint16 constant NOT_FACTORY = 1002;
    uint16 constant FILLED_ALREDY = 1003;
    uint16 constant NOT_STARTED = 1004;
    uint16 constant NOT_FILLED = 1005;
    uint16 constant VESTED_ALREADY = 1006;
    uint16 constant LOW_VALUE = 1007;

    uint128 constant CONTRACT_MIN_BALANCE = 1 ton;
    uint128 constant MIN_MSG_VALUE = 1 ton;

    constructor(
        address _user,
        address _creator,
        address _remainingGasTo,
        uint128 _vestingAmount,
        uint32 _vestingStart,
        uint32 _vestingEnd
    ) public {
        require(msg.sender == factory, NOT_FACTORY);
        tvm.rawReserve(CONTRACT_MIN_BALANCE, 0);

        user = _user;
        creator = _creator;
        vestingAmount = _vestingAmount;
        vestingStart = _vestingStart;
        vestingEnd = _vestingEnd;
        lastClaimTime = vestingStart;

        IFactory(factory).onVestingDeployed{
            value: 0,
            flag: MsgFlag.ALL_NOT_RESERVED
        }(
            nonce,
            user,
            creator,
            _remainingGasTo,
            address.makeAddrNone(),
            vestingAmount,
            vestingStart,
            vestingEnd
        );
    }

    function getDetails()
        external
        view
        returns (
            address _user,
            address _creator,
            uint128 _vestingAmount,
            uint32 _vestingStart,
            uint32 _vestingEnd,
            uint32 _lastClaimTime,
            uint128 _balance,
            bool _filled,
            bool _vested,
            uint128 _nonce,
            address _factory
        )
    {
        return (
            user,
            creator,
            vestingAmount,
            vestingStart,
            vestingEnd,
            lastClaimTime,
            balance,
            filled,
            vested,
            nonce,
            factory
        );
    }

    function deposit(address send_gas_to) external {
        require(msg.value >= vestingAmount + MIN_MSG_VALUE, LOW_VALUE);
        require(filled == false, FILLED_ALREDY);

        balance = vestingAmount;
        filled = true;

        emit Deposit(msg.sender, vestingAmount);
        tvm.rawReserve(vestingAmount + CONTRACT_MIN_BALANCE, 0);

        send_gas_to.transfer(0, false, MsgFlag.ALL_NOT_RESERVED);
    }

    function pendingVested() external view returns (uint128 value_to_claim) {
        if (now >= vestingEnd) {
            value_to_claim = balance;
        } else if (now >= lastClaimTime) {
            uint32 period_left = vestingEnd - lastClaimTime;
            uint32 period_passed = now - lastClaimTime;
            value_to_claim = (balance * period_passed) / period_left;
        } else {
            value_to_claim = 0;
        }
    }

    function claim() external {
        require(msg.sender == user, NOT_USER);
        require(now >= vestingStart, NOT_STARTED);
        require(filled == true, NOT_FILLED);
        require(vested == false, VESTED_ALREADY);
        require(msg.value >= MIN_MSG_VALUE, LOW_VALUE);

        uint128 value_to_claim;
        if (now >= vestingEnd) {
            value_to_claim = balance;
        } else {
            uint32 period_left = vestingEnd - lastClaimTime;
            uint32 period_passed = now - lastClaimTime;
            value_to_claim = (balance * period_passed) / period_left;
        }

        balance -= value_to_claim;
        lastClaimTime = now;

        emit Claim(value_to_claim, balance);
        if (balance == 0) {
            vested = true;
            emit Vested();
        }

        tvm.rawReserve(balance + CONTRACT_MIN_BALANCE, 0);
        msg.sender.transfer(0, false, MsgFlag.ALL_NOT_RESERVED);
    }
}

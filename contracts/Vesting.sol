pragma ton-solidity ^0.57.1;
pragma AbiHeader expire;


import "broxus-ton-tokens-contracts/contracts/interfaces/ITokenRoot.sol";
import "broxus-ton-tokens-contracts/contracts/interfaces/ITokenWallet.sol";
import "broxus-ton-tokens-contracts/contracts/interfaces/IAcceptTokensTransferCallback.sol";
import "@broxus/contracts/contracts/libraries/MsgFlag.sol";
import "interfaces/IFactory.sol";


contract Vesting {
    event ReceivedTokenWalletAddress(address wallet);
    event Deposit(address sender, uint128 amount);
    event BadDeposit(address sender, uint128 amount);
    event Claim(uint128 amount, uint128 remaining_amount);
    event Vested();

    uint128 static nonce;
    address static factory;

    // setup params
    address user;
    address creator;
    address token;
    uint128 vestingAmount;
    uint32 vestingStart;
    uint32 vestingEnd;

    uint32 lastClaimTime;
    uint128 tokenBalance;
    address tokenWallet;
    bool filled;
    bool vested;

    uint16 constant NOT_USER = 1001;
    uint16 constant NOT_FACTORY = 1002;
    uint16 constant NOT_WALLET = 1003;
    uint16 constant NOT_STARTED = 1004;
    uint16 constant NOT_FILLED = 1005;
    uint16 constant VESTED_ALREADY = 1006;
    uint16 constant LOW_VALUE = 1007;
    uint16 constant NOT_TOKEN = 1008;

    uint128 constant TOKEN_WALLET_DEPLOY_VALUE = 0.5 ton;
    uint128 constant CONTRACT_MIN_BALANCE = 1 ton;
    uint128 constant MIN_MSG_VALUE = 1 ton;
    uint128 constant FACTORY_DEPLOY_CALLBACK_VALUE = 0.1 ton;

    constructor(
        address _user,
        address _creator,
        address _token,
        uint128 _vestingAmount,
        uint32 _vestingStart,
        uint32 _vestingEnd
    ) public {
        require (msg.sender == factory, NOT_FACTORY);

        user = _user;
        creator = _creator;
        token = _token;
        vestingAmount = _vestingAmount;
        vestingStart = _vestingStart;
        vestingEnd = _vestingEnd;
        lastClaimTime = vestingStart;

        _setupTokenWallets();
        IFactory(factory).onVestingDeployed{value: FACTORY_DEPLOY_CALLBACK_VALUE}(
            nonce, user, creator, token, vestingAmount, vestingStart, vestingEnd
        );
    }

    function _setupTokenWallets() internal view {
        ITokenRoot(token).deployWallet{value: TOKEN_WALLET_DEPLOY_VALUE, callback: Vesting.receiveTokenWalletAddress }(
            address(this), // owner
            TOKEN_WALLET_DEPLOY_VALUE / 2 // deploy grams
        );

        ITokenRoot(token).deployWallet{value: TOKEN_WALLET_DEPLOY_VALUE, callback: Vesting.dummy }(
            user, // owner
            TOKEN_WALLET_DEPLOY_VALUE / 2 // deploy grams
        );
    }

    function receiveTokenWalletAddress(address wallet) external {
        require (msg.sender == token, NOT_TOKEN);
        tokenWallet = wallet;
        emit ReceivedTokenWalletAddress(wallet);
    }

    function dummy(address) external view { require (msg.sender == token, NOT_TOKEN); }

    function getDetails() external view returns (
        address _user,
        address _creator,
        address _token,
        uint128 _vestingAmount,
        uint32 _vestingStart,
        uint32 _vestingEnd,
        uint32 _lastClaimTime,
        uint128 _tokenBalance,
        address _tokenWallet,
        bool _filled,
        bool _vested,
        uint128 _nonce,
        address _factory
    ) {
        return (
            user, creator, token, vestingAmount, vestingStart, vestingEnd, lastClaimTime,
            tokenBalance, tokenWallet, filled, vested, nonce, factory
        );
    }

    function _reserve() internal virtual pure returns (uint128) {
        return math.max(address(this).balance - msg.value, CONTRACT_MIN_BALANCE);
    }

    // deposit occurs here
    function onAcceptTokensTransfer(
        address,
        uint128 amount,
        address sender,
        address,
        address remainingGasTo,
        TvmCell
    ) external  {
        require (msg.sender == tokenWallet, NOT_WALLET);

        tvm.rawReserve(_reserve(), 0);

        if (amount != vestingAmount || filled == true) {
            emit BadDeposit(sender, amount);
            TvmCell empty;
            ITokenWallet(tokenWallet).transfer{value: 0, flag: MsgFlag.ALL_NOT_RESERVED}(
                amount, sender, 0, sender, false, empty
            );
            return;
        }

        tokenBalance = amount;
        filled = true;

        emit Deposit(sender, amount);
        remainingGasTo.transfer(0, false, MsgFlag.ALL_NOT_RESERVED);
    }

    function pendingVested() external view returns (uint128 tokens_to_claim) {
        if (now >= vestingEnd) {
            tokens_to_claim = tokenBalance;
        } else if (now >= lastClaimTime) {
            uint32 period_left = vestingEnd - lastClaimTime;
            uint32 period_passed = now - lastClaimTime;
            tokens_to_claim = (tokenBalance * period_passed) / period_left;
        } else {
            tokens_to_claim = 0;
        }
    }

    function claim() external {
        require (msg.sender == user, NOT_USER);
        require (now >= vestingStart, NOT_STARTED);
        require (filled == true, NOT_FILLED);
        require (vested == false, VESTED_ALREADY);
        require (msg.value >= MIN_MSG_VALUE, LOW_VALUE);

        tvm.rawReserve(_reserve(), 0);

        uint128 tokens_to_claim;
        if (now >= vestingEnd) {
            tokens_to_claim = tokenBalance;
        } else {
            uint32 period_left = vestingEnd - lastClaimTime;
            uint32 period_passed = now - lastClaimTime;
            tokens_to_claim = (tokenBalance * period_passed) / period_left;
        }

        tokenBalance -= tokens_to_claim;
        lastClaimTime = now;

        emit Claim(tokens_to_claim, tokenBalance);
        if (tokenBalance == 0) {
            vested = true;
            emit Vested();
        }

        TvmCell empty;
        ITokenWallet(tokenWallet).transfer{value: 0, flag: MsgFlag.ALL_NOT_RESERVED}(
            tokens_to_claim, user, 0, user, false, empty
        );
    }

}

pragma ever-solidity ^0.62.0;
pragma AbiHeader expire;
pragma AbiHeader pubkey;


import "@broxus/contracts/contracts/libraries/MsgFlag.sol";
import "Vesting.sol";
import "NativeVesting.sol";
import "indexer/Indexer.sol";

contract VestingFactory {
    event NewVesting(address vesting, address user, address creator, address token, uint128 amount, uint32 start, uint32 end);

    uint128 public static deploy_nonce;
    TvmCell static vestingCode;
    TvmCell static nativeVestingCode;
    uint128 public vestings_deployed;
    address public _indexer;

    uint16 constant WRONG_PUBKEY = 1001;
    uint16 constant BAD_PARAMS = 1002;
    uint16 constant LOW_VALUE = 1003;
    uint16 constant NOT_VESTING = 1004;

    uint128 constant CONTRACT_MIN_BALANCE = 1 ton;
    uint128 constant VESTING_DEPLOY_VALUE = 2 ton;
    uint128 constant INDEX_DEPLOY_VALUE = 0.25 ton;


    constructor(address indexer) public {
        require (tvm.pubkey() != 0, WRONG_PUBKEY);
        require (tvm.pubkey() == msg.pubkey(), WRONG_PUBKEY);

        tvm.accept();
        _indexer = indexer;
    }

    function _reserve() internal pure returns (uint128) {
        return math.max(address(this).balance - msg.value, CONTRACT_MIN_BALANCE);
    }

    function deployNativeVesting(
        address user,
        uint128 vesting_amount,
        uint32 vesting_start,
        uint32 vesting_end
    ) external {
        require (vesting_start > now, BAD_PARAMS);
        require (vesting_end > vesting_start, BAD_PARAMS);
        require (vesting_amount > 0, BAD_PARAMS);
        require (msg.value >= VESTING_DEPLOY_VALUE, LOW_VALUE);

        TvmCell stateInit = tvm.buildStateInit({
            contr: NativeVesting,
            varInit: {
                nonce: vestings_deployed,
                factory: address(this)
            },
            pubkey: tvm.pubkey(),
            code: nativeVestingCode
        });
        vestings_deployed += 1;

        tvm.rawReserve(_reserve(), 0);

        new NativeVesting{
            stateInit: stateInit,
            value: 0,
            wid: address(this).wid,
            flag: MsgFlag.ALL_NOT_RESERVED
        }(user, msg.sender, vesting_amount, vesting_start, vesting_end);
    }

    function deployVesting(
        address user,
        address token,
        uint128 vesting_amount,
        uint32 vesting_start,
        uint32 vesting_end
    ) external {
        require (vesting_start > now, BAD_PARAMS);
        require (vesting_end > vesting_start, BAD_PARAMS);
        require (vesting_amount > 0, BAD_PARAMS);
        require (msg.value >= VESTING_DEPLOY_VALUE, LOW_VALUE);

        TvmCell stateInit = tvm.buildStateInit({
            contr: Vesting,
            varInit: {
                nonce: vestings_deployed,
                factory: address(this)
            },
            pubkey: tvm.pubkey(),
            code: vestingCode
        });
        vestings_deployed += 1;

        tvm.rawReserve(_reserve(), 0);

        new Vesting{
            stateInit: stateInit,
            value: 0,
            wid: address(this).wid,
            flag: MsgFlag.ALL_NOT_RESERVED
        }(user, msg.sender, token, vesting_amount, vesting_start, vesting_end);
    }

    function onVestingDeployed(
        uint128 nonce,
        address user,
        address creator,
        address token,
        uint128 vesting_amount,
        uint32 vesting_start,
        uint32 vesting_end
    ) external view {

        TvmCell stateInit;
        uint8 vesting_contract_type;
        if (token == address.makeAddrNone()) {
            vesting_contract_type = VestingContractType.VESTING_NATIVE;
            stateInit = tvm.buildStateInit({
                contr: NativeVesting,
                varInit: {
                    nonce: nonce,
                    factory: address(this)
                },
                pubkey: tvm.pubkey(),
                code: nativeVestingCode
            });
        } else {
            vesting_contract_type = VestingContractType.VESTING;
            stateInit = tvm.buildStateInit({
                contr: Vesting,
                varInit: {
                    nonce: nonce,
                    factory: address(this)
                },
                pubkey: tvm.pubkey(),
                code: vestingCode
            });
        }

        address vesting_address = address(tvm.hash(stateInit));
        require (msg.sender == vesting_address, NOT_VESTING);

        emit NewVesting(msg.sender, user, creator, token, vesting_amount, vesting_start, vesting_end);

        Indexer(_indexer).deployIndex{ value: INDEX_DEPLOY_VALUE }(
            vesting_address,
            user,
            IndexType.RECIPIENT,
            vesting_contract_type
        );
        Indexer(_indexer).deployIndex{ value: INDEX_DEPLOY_VALUE }(
            vesting_address,
            creator,
            IndexType.CREATOR,
            vesting_contract_type
        );
        if (vesting_contract_type == VestingContractType.VESTING) {
            Indexer(_indexer).deployIndex{ value: INDEX_DEPLOY_VALUE }(
                vesting_address,
                token,
                IndexType.TOKEN,
                vesting_contract_type
            );
        }
    }
}

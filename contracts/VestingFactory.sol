pragma ever-solidity ^0.62.0;
pragma AbiHeader expire;
pragma AbiHeader pubkey;

import "@broxus/contracts/contracts/libraries/MsgFlag.tsol";
import "Vesting.sol";
import "NativeVesting.sol";
import "indexer/IndexFactory.tsol";

contract VestingFactory is IndexFactory {
    event NewVesting(
        address vesting,
        address user,
        address creator,
        address token,
        uint128 amount,
        uint32 start,
        uint32 end
    );

    uint128 public static deploy_nonce;
    TvmCell static vestingCode;
    TvmCell static nativeVestingCode;
    uint128 public vestings_deployed;

    uint16 constant WRONG_PUBKEY = 1001;
    uint16 constant BAD_PARAMS = 1002;
    uint16 constant LOW_VALUE = 1003;
    uint16 constant NOT_VESTING = 1004;

    uint128 constant CONTRACT_MIN_BALANCE = 1 ton;
    uint128 constant VESTING_DEPLOY_VALUE = 2 ton;

    constructor(
        TvmCell indexCode,
        uint128 indexDeployValue,
        uint128 indexDestroyValue
    ) public IndexFactory(indexCode, indexDeployValue, indexDestroyValue) {
        require(tvm.pubkey() != 0, WRONG_PUBKEY);
        require(tvm.pubkey() == msg.pubkey(), WRONG_PUBKEY);
        tvm.accept();
    }

    function _reserve() internal pure returns (uint128) {
        return
            math.max(address(this).balance - msg.value, CONTRACT_MIN_BALANCE);
    }

    function deployNativeVesting(
        address user,
        address remainingGasTo,
        uint128 vesting_amount,
        uint32 vesting_start,
        uint32 vesting_end
    ) external {
        require(vesting_start > now, BAD_PARAMS);
        require(vesting_end > vesting_start, BAD_PARAMS);
        require(vesting_amount > 0, BAD_PARAMS);
        require(
            msg.value >= VESTING_DEPLOY_VALUE + _indexDeployValue * 2,
            LOW_VALUE
        );
        tvm.rawReserve(_reserve(), 0);

        TvmCell stateInit = tvm.buildStateInit({
            contr: NativeVesting,
            varInit: { nonce: vestings_deployed, factory: address(this) },
            pubkey: tvm.pubkey(),
            code: nativeVestingCode
        });
        vestings_deployed += 1;

        new NativeVesting{
            stateInit: stateInit,
            value: 0,
            wid: address(this).wid,
            flag: MsgFlag.ALL_NOT_RESERVED
        }(
            user,
            msg.sender,
            remainingGasTo,
            vesting_amount,
            vesting_start,
            vesting_end
        );
    }

    function deployVesting(
        address user,
        address remainingGasTo,
        address token,
        uint128 vesting_amount,
        uint32 vesting_start,
        uint32 vesting_end
    ) external {
        require(vesting_start > now, BAD_PARAMS);
        require(vesting_end > vesting_start, BAD_PARAMS);
        require(vesting_amount > 0, BAD_PARAMS);
        require(
            msg.value >= VESTING_DEPLOY_VALUE + _indexDeployValue * 3,
            LOW_VALUE
        );
        tvm.rawReserve(_reserve(), 0);

        TvmCell stateInit = tvm.buildStateInit({
            contr: Vesting,
            varInit: { nonce: vestings_deployed, factory: address(this) },
            pubkey: tvm.pubkey(),
            code: vestingCode
        });
        vestings_deployed += 1;

        new Vesting{
            stateInit: stateInit,
            value: 0,
            wid: address(this).wid,
            flag: MsgFlag.ALL_NOT_RESERVED
        }(
            user,
            msg.sender,
            remainingGasTo,
            token,
            vesting_amount,
            vesting_start,
            vesting_end
        );
    }

    function onVestingDeployed(
        uint128 nonce,
        address user,
        address creator,
        address remainingGasTo,
        address token,
        uint128 vesting_amount,
        uint32 vesting_start,
        uint32 vesting_end
    ) external view {
        tvm.rawReserve(_reserve(), 0);
        TvmCell stateInit;
        string vesting_contract_type = "Vesting";
        if (token == address.makeAddrNone()) {
            vesting_contract_type = "NativeVesting";
            stateInit = tvm.buildStateInit({
                contr: NativeVesting,
                varInit: { nonce: nonce, factory: address(this) },
                pubkey: tvm.pubkey(),
                code: nativeVestingCode
            });
        } else {
            stateInit = tvm.buildStateInit({
                contr: Vesting,
                varInit: { nonce: nonce, factory: address(this) },
                pubkey: tvm.pubkey(),
                code: vestingCode
            });
        }

        address vesting_address = address(tvm.hash(stateInit));
        require(msg.sender == vesting_address, NOT_VESTING);

        emit NewVesting(
            msg.sender,
            user,
            creator,
            token,
            vesting_amount,
            vesting_start,
            vesting_end
        );

        deployUserIndex(
            vesting_address,
            "recipient",
            user,
            vesting_contract_type
        );

        deployUserIndex(
            vesting_address,
            "creator",
            creator,
            vesting_contract_type
        );
        if (vesting_contract_type == "Vesting") {
            deployTokenIndex(vesting_address, "token", token);
        }

        remainingGasTo.transfer({ value: 0, flag: MsgFlag.ALL_NOT_RESERVED });
    }

    function deployUserIndex(
        address vesting,
        string indexName,
        address user,
        string contractType
    ) internal view {
        TvmBuilder builder;
        builder.store(user);
        builder.store(contractType);
        deployIndex(vesting, indexName, builder.toCell());
    }

    function deployTokenIndex(
        address vesting,
        string indexName,
        address token
    ) internal view {
        TvmBuilder builder;
        builder.store(token);
        deployIndex(vesting, indexName, builder.toCell());
    }
}

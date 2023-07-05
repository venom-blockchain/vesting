pragma ever-solidity >=0.62.0;

pragma AbiHeader expire;
pragma AbiHeader pubkey;

import "indexer/Index.sol";
import "indexer/Indexer.sol";

contract VestingIndexer is Indexer {
  constructor(
    address owner,
    TvmCell indexCode,
    uint128 indexDeployValue,
    uint128 indexDestroyValue
  ) public Indexer(owner, indexCode, indexDeployValue, indexDestroyValue) {}

  function deployRecipientIndex(
    address vesting,
    address recipient,
    string contractType
  ) public onlyRootContractOrOwner {
    Index.Salt[] saltParams;
    Index.Salt recipientParam = buildAddressSaltParam("recipient", recipient);
    Index.Salt contractTypeParam = buildStringSaltParam("contractType", contractType);

    saltParams.push(recipientParam);
    saltParams.push(contractTypeParam);

    deployIndex(vesting, saltParams);
  }

  function deployCreatorIndex(address vesting, address creator, string contractType) public onlyRootContractOrOwner {
    Index.Salt[] saltParams;
    Index.Salt creatorParam = buildAddressSaltParam("creator", creator);
    Index.Salt contractTypeParam = buildStringSaltParam("contractType", contractType);

    saltParams.push(creatorParam);
    saltParams.push(contractTypeParam);

    deployIndex(vesting, saltParams);
  }

  function deployTokenIndex(address vesting, address token) public onlyRootContractOrOwner {
    Index.Salt[] saltParams;
    Index.Salt creatorParam = buildAddressSaltParam("token", token);
    
    saltParams.push(creatorParam);

    deployIndex(vesting, saltParams);
  }

  function buildAddressSaltParam(string name, address addr) internal view returns (Index.Salt) {
    TvmBuilder builder;
    builder.store(addr);

    Index.Salt param = Index.Salt(name, "address", builder.toCell());
    return param;
  }

  function buildStringSaltParam(string name, string str) internal view returns (Index.Salt) {
    TvmBuilder builder;
    builder.store(str);

    Index.Salt param = Index.Salt(name, "string", builder.toCell());
    return param;
  }
}

import { Address } from "locklift";
import { BigNumber as bn } from "bignumber.js";

export async function getSaltedCodeHash(
  tvcCode: string,
  vestingFactory: Address,
  acc: Address,
  indexType: 0 | 1 | 2,
  vestingContractType: 0 | 1,
): Promise<string> {
  const { hash: saltedCodeHash } = await locklift.provider.setCodeSalt({
    code: tvcCode,
    salt: {
      structure: [
        { name: "_vestingFactory", type: "address" },
        { name: "_acc", type: "address" },
        { name: "_indexType", type: "uint8" },
        { name: "_vestingContractType", type: "uint8" },
      ] as const,
      abiVersion: "2.1",
      data: {
        _vestingFactory: vestingFactory,
        _acc: acc,
        _indexType: indexType,
        _vestingContractType: vestingContractType,
      },
    },
  });

  return "0x" + saltedCodeHash;
}

async function main() {
  const vestingFactoryAddress = new Address("0:f0cf6687a52ed68b1c5015089343a82f79a79cbbfdef22dab48b3d05bac34693");
  const indexerAddress = new Address("0:90a31d294e25afc20387bcc01606237f91377c585cd7c52b401a24976a9856a4");
  const user0 = new Address("");
  const user1 = new Address("");
  const tokenRoot = locklift.factory.getDeployedContract("TokenRootUpgradeable", new Address(""));

  const vestingFactory = locklift.factory.getDeployedContract("VestingFactory", vestingFactoryAddress);
  const indexer = locklift.factory.getDeployedContract("Indexer", indexerAddress);

  const start = Math.floor(locklift.testing.getCurrentTime() / 1000) + 15;
  const end = start + 20;

  const tx = vestingFactory.methods
    .deployVesting({
      user: user0,
      token: tokenRoot.address,
      vesting_amount: new bn(100).multipliedBy(1e18).toFixed(),
      vesting_start: start,
      vesting_end: end,
    })
    .send({ from: user1, amount: locklift.utils.toNano(2.5) });

  await locklift.transactions.waitFinalized(tx);
  console.log('deploy vesting tx:', (await tx).id.hash)

  const { codeIndex } = await indexer.methods.getCodeIndex({ answerId: 0 }).call();

  const codeHash = await getSaltedCodeHash(codeIndex, vestingFactory.address, user0, 0, 0);
  console.log("codeHash", codeHash);

  const indexes = (await locklift.provider.getAccountsByCodeHash({ codeHash })).accounts;
  console.log("indexes", indexes);
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.log(e);
    process.exit(1);
  });

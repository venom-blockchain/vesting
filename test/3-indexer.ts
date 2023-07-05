import { expect } from "chai";
import { Address, Contract } from "locklift";
import { Account } from "locklift/everscale-client";
import { FactorySource } from "../build/factorySource";
import { bn, deployUser, setupTokenRoot } from "./utils/common";
import { Token } from "./utils/wrappers/token";
import { TokenWallet } from "./utils/wrappers/token_wallet";

const logger = require("mocha-logger");

describe("Test index creation for vesting contracts", async function () {
  let admin: Account;
  let adminTokenWallet: TokenWallet;
  let user0: Account;
  let user0TokenWallet: TokenWallet;
  let user1: Account;
  let user1TokenWallet: TokenWallet;

  let token: Token;

  let indexer: Contract<FactorySource["VestingIndexer"]>;
  let factory: Contract<FactorySource["VestingFactory"]>;

  let indexCode: string;
  const vestingArtifacts = locklift.factory.getContractArtifacts("Vesting");
  const nativeVestingArtifacts = locklift.factory.getContractArtifacts("NativeVesting");
  const indexArtifacts = locklift.factory.getContractArtifacts("Index");
  const factoryArtifacts = locklift.factory.getContractArtifacts("VestingFactory");

  beforeEach("Setup contracts", async function () {
    admin = await deployUser(20, "admin");
    user0 = await deployUser(20, "user0");
    user1 = await deployUser(20, "user1");

    const signer = await locklift.keystore.getSigner("0");
    const deployNonce = locklift.utils.getRandomNonce();

    const factoryExpectedAddress = await locklift.provider.getExpectedAddress(factoryArtifacts.abi, {
      tvc: factoryArtifacts.tvc,
      publicKey: signer?.publicKey as string,
      initParams: {
        deploy_nonce: deployNonce,
        nativeVestingCode: nativeVestingArtifacts.code,
        vestingCode: vestingArtifacts.code,
      },
    });
    logger.log(`Expected factory address: ${factoryExpectedAddress}`);

    const { contract: _indexer } = await locklift.factory.deployContract({
      contract: "VestingIndexer",
      publicKey: signer?.publicKey as string,
      initParams: {
        _rootContract: factoryExpectedAddress,
        _nonce: locklift.utils.getRandomNonce(),
      },
      constructorParams: {
        owner: admin.address,
        indexCode: indexArtifacts.code,
        indexDeployValue: locklift.utils.toNano(0.2),
        indexDestroyValue: locklift.utils.toNano(0.2),
      },
      value: locklift.utils.toNano(5),
    });
    indexer = _indexer;
    logger.log(`Indexer address: ${indexer.address}`);

    const { indexCode: _indexCode } = await indexer.methods.getIndexCode({ answerId: 0 }).call();
    indexCode = _indexCode;

    const { contract: _factory } = await locklift.factory.deployContract({
      contract: "VestingFactory",
      publicKey: signer?.publicKey as string,
      initParams: {
        nativeVestingCode: nativeVestingArtifacts.code,
        vestingCode: vestingArtifacts.code,
        deploy_nonce: deployNonce,
      },
      constructorParams: { indexer: indexer.address },
      value: locklift.utils.toNano(5),
    });
    factory = _factory;
    logger.log(`Factory address: ${factory.address}`);

    token = await setupTokenRoot("Example Token", "EXMPL", admin);
    adminTokenWallet = await token.wallet(admin);
    user0TokenWallet = await token.wallet(user0);
    user1TokenWallet = await token.wallet(user1);
  });
  it("should deploy 2 vesting contract with indexes", async function () {
    const start = Math.floor(locklift.testing.getCurrentTime() / 1000) + 15;
    const end = start + 20;

    await token.mint(bn(100).multipliedBy(1e18).toFixed(), user1);
    locklift.tracing.setAllowedCodes({ compute: [1008] });
    await locklift.tracing.trace(
      factory.methods
        .deployVesting({
          user: user0.address,
          token: token.address,
          vesting_amount: bn(100).multipliedBy(1e18).toFixed(),
          vesting_start: start,
          vesting_end: end,
        })
        .send({ from: user1.address, amount: locklift.utils.toNano(2.5) }),
    );
    await locklift.tracing.trace(
      factory.methods
        .deployVesting({
          user: user0.address,
          token: token.address,
          vesting_amount: bn(100).multipliedBy(1e18).toFixed(),
          vesting_start: start,
          vesting_end: end,
        })
        .send({ from: user1.address, amount: locklift.utils.toNano(2.5) }),
    );

    const userIndexCodeHash = await calculateAccIndexCodeHash(indexCode, "recipient", user0.address, "Vesting");
    const creatorIndexCodeHash = await calculateAccIndexCodeHash(indexCode, "creator", user1.address, "Vesting");
    const tokenIndexCodeHash = await calculateTokenIndexCodeHash(indexCode, token.address);

    const { accounts: userAccs } = await locklift.provider.getAccountsByCodeHash({ codeHash: userIndexCodeHash });
    const { accounts: creatorAccs } = await locklift.provider.getAccountsByCodeHash({ codeHash: creatorIndexCodeHash });
    const { accounts: tokenAccs } = await locklift.provider.getAccountsByCodeHash({ codeHash: tokenIndexCodeHash });

    expect(userAccs.length).to.be.equal(2);
    expect(creatorAccs.length).to.be.equal(2);
    expect(tokenAccs.length).to.be.equal(2);
  }),
    it("should deploy 2 native vesting contract with indexes", async function () {
      const start = Math.floor(locklift.testing.getCurrentTime() / 1000) + 15;
      const end = start + 20;

      await token.mint(bn(100).multipliedBy(1e18).toFixed(), user1);

      await locklift.tracing.trace(
        factory.methods
          .deployNativeVesting({
            user: user0.address,
            vesting_amount: bn(1).multipliedBy(1e9).toFixed(),
            vesting_start: start,
            vesting_end: end,
          })
          .send({ from: user1.address, amount: locklift.utils.toNano(2.5) }),
      );
      await locklift.tracing.trace(
        factory.methods
          .deployNativeVesting({
            user: user0.address,
            vesting_amount: bn(1).multipliedBy(1e9).toFixed(),
            vesting_start: start,
            vesting_end: end,
          })
          .send({ from: user1.address, amount: locklift.utils.toNano(2.5) }),
      );

      const userIndexCodeHash = await calculateAccIndexCodeHash(indexCode, "recipient", user0.address, "NativeVesting");

      const creatorIndexCodeHash = await calculateAccIndexCodeHash(
        indexCode,
        "creator",
        user1.address,
        "NativeVesting",
      );

      const { accounts: userAccs } = await locklift.provider.getAccountsByCodeHash({ codeHash: userIndexCodeHash });
      const { accounts: creatorAccs } = await locklift.provider.getAccountsByCodeHash({
        codeHash: creatorIndexCodeHash,
      });

      expect(userAccs.length).to.be.equal(2);
      expect(creatorAccs.length).to.be.equal(2);
    });
});

export async function calculateAccIndexCodeHash(
  tvcCode: string,
  accType: "recipient" | "creator",
  acc: Address,
  contractType: "Vesting" | "NativeVesting",
): Promise<string> {
  const accPacked = await locklift.provider.packIntoCell({
    abiVersion: "2.1",
    structure: [{ name: "value", type: "address" }] as const,
    data: {
      value: acc,
    },
  });
  const contractTypePacked = await locklift.provider.packIntoCell({
    abiVersion: "2.1",
    structure: [{ name: "value", type: "string" }] as const,
    data: {
      value: contractType,
    },
  });
  const { hash: saltedCodeHash } = await locklift.provider.setCodeSalt({
    code: tvcCode,
    salt: {
      structure: [
        {
          components: [
            { name: "key", type: "string" },
            { name: "valueType", type: "string" },
            { name: "value", type: "cell" },
          ],
          name: "saltParams",
          type: "tuple[]",
        },
      ] as const,
      abiVersion: "2.1",
      data: {
        saltParams: [
          { key: accType, valueType: "address", value: accPacked.boc },
          { key: "contractType", valueType: "string", value: contractTypePacked.boc },
        ],
      },
    },
  });

  return "0x" + saltedCodeHash;
}
export async function calculateTokenIndexCodeHash(tvcCode: string, token: Address): Promise<string> {
  const tokenPacked = await locklift.provider.packIntoCell({
    abiVersion: "2.1",
    structure: [{ name: "value", type: "address" }] as const,
    data: {
      value: token,
    },
  });

  const { hash: saltedCodeHash } = await locklift.provider.setCodeSalt({
    code: tvcCode,
    salt: {
      structure: [
        {
          components: [
            { name: "key", type: "string" },
            { name: "valueType", type: "string" },
            { name: "value", type: "cell" },
          ],
          name: "saltParams",
          type: "tuple[]",
        },
      ] as const,
      abiVersion: "2.1",
      data: {
        saltParams: [{ key: "token", valueType: "address", value: tokenPacked.boc }],
      },
    },
  });

  return "0x" + saltedCodeHash;
}

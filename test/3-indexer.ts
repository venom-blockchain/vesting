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
  let user2: Account;
  let user2TokenWallet: TokenWallet;

  let token: Token;

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
    user2 = await deployUser(20, "user2");

    const signer = await locklift.keystore.getSigner("0");
    const deployNonce = locklift.utils.getRandomNonce();

    const { contract: _factory } = await locklift.factory.deployContract({
      contract: "VestingFactory",
      publicKey: signer?.publicKey as string,
      initParams: {
        nativeVestingCode: nativeVestingArtifacts.code,
        vestingCode: vestingArtifacts.code,
        deploy_nonce: deployNonce,
      },
      constructorParams: {
        indexCode: indexArtifacts.code,
        indexDeployValue: locklift.utils.toNano(0.2),
        indexDestroyValue: locklift.utils.toNano(0.2),
      },
      value: locklift.utils.toNano(5),
    });
    factory = _factory;
    logger.log(`Factory address: ${factory.address}`);

    token = await setupTokenRoot("Example Token", "EXMPL", admin);
    adminTokenWallet = await token.wallet(admin);
    user0TokenWallet = await token.wallet(user0);
    user1TokenWallet = await token.wallet(user1);
    user2TokenWallet = await token.wallet(user2);
  });
  it("should deploy 2 indexes for user0 as recipient and 3 indexes for user1 as creator", async function () {
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
    await locklift.tracing.trace(
      factory.methods
        .deployVesting({
          user: user2.address,
          token: token.address,
          vesting_amount: bn(100).multipliedBy(1e18).toFixed(),
          vesting_start: start,
          vesting_end: end,
        })
        .send({ from: user1.address, amount: locklift.utils.toNano(2.5) }),
    );

    const userIndexCodeHash = await getUserIndexSaltedCodeHash(
      factory.address,
      indexArtifacts.code,
      "recipient",
      "Vesting",
      user0.address,
    );
    const creatorIndexCodeHash = await getUserIndexSaltedCodeHash(
      factory.address,
      indexArtifacts.code,
      "creator",
      "Vesting",
      user1.address,
    );
    const tokenIndexCodeHash = await getTokenIndexSaltedCodeHash(factory.address, indexArtifacts.code, token.address);

    const { accounts: userAccs } = await locklift.provider.getAccountsByCodeHash({ codeHash: userIndexCodeHash });
    const { accounts: creatorAccs } = await locklift.provider.getAccountsByCodeHash({ codeHash: creatorIndexCodeHash });
    const { accounts: tokenAccs } = await locklift.provider.getAccountsByCodeHash({ codeHash: tokenIndexCodeHash });

    expect(userAccs.length).to.be.equal(2);
    expect(creatorAccs.length).to.be.equal(3);
    expect(tokenAccs.length).to.be.equal(3);
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

      const userIndexCodeHash = await getUserIndexSaltedCodeHash(
        factory.address,
        indexArtifacts.code,
        "recipient",
        "NativeVesting",
        user0.address,
      );

      const creatorIndexCodeHash = await getUserIndexSaltedCodeHash(
        factory.address,
        indexArtifacts.code,
        "creator",
        "NativeVesting",
        user1.address,
      );

      const { accounts: userAccs } = await locklift.provider.getAccountsByCodeHash({ codeHash: userIndexCodeHash });
      const { accounts: creatorAccs } = await locklift.provider.getAccountsByCodeHash({
        codeHash: creatorIndexCodeHash,
      });

      expect(userAccs.length).to.be.equal(2);
      expect(creatorAccs.length).to.be.equal(2);
    });
});

export async function getUserIndexSaltedCodeHash(
  indexFactory: Address,
  indexCode: string,
  indexName: "recipient" | "creator",
  contractType: "Vesting" | "NativeVesting",
  user: Address,
): Promise<string> {
  const saltValuePacked = await locklift.provider.packIntoCell({
    abiVersion: "2.1",
    structure: [
      { name: "contractType", type: "string" },
      { name: "user", type: "address" },
    ] as const,
    data: {
      contractType: contractType,
      user: user,
    },
  });
  const { hash: saltedCodeHash } = await locklift.provider.setCodeSalt({
    code: indexCode,
    salt: {
      abiVersion: "2.1",
      structure: [
        { name: "indexFactory", type: "address" },
        { name: "saltKey", type: "string" },
        { name: "saltValue", type: "cell" },
      ] as const,
      data: {
        indexFactory: indexFactory,
        saltKey: indexName,
        saltValue: saltValuePacked.boc,
      },
    },
  });

  return "0x" + saltedCodeHash;
}

export async function getTokenIndexSaltedCodeHash(
  indexFactory: Address,
  indexCode: string,
  token: Address,
): Promise<string> {
  const saltValuePacked = await locklift.provider.packIntoCell({
    abiVersion: "2.1",
    structure: [{ name: "token", type: "address" }] as const,
    data: {
      token: token,
    },
  });
  const { hash: saltedCodeHash } = await locklift.provider.setCodeSalt({
    code: indexCode,
    salt: {
      abiVersion: "2.1",
      structure: [
        { name: "indexFactory", type: "address" },
        { name: "saltKey", type: "string" },
        { name: "saltValue", type: "cell" },
      ] as const,
      data: {
        indexFactory: indexFactory,
        saltKey: "token",
        saltValue: saltValuePacked.boc,
      },
    },
  });

  return "0x" + saltedCodeHash;
}

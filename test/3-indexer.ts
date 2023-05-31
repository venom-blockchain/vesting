import { expect } from "chai";
import { Address, Contract } from "locklift";
import { Account } from "locklift/everscale-client";
import { FactorySource } from "../build/factorySource";
import { bn, deployUser, setupTokenRoot } from "./utils/common";
import {
  getSaltedCodeHash,
  validateIndexInfo,
  validateIndexesAmount,
  validateIndexCodeHash,
  validateIndexAddress,
} from "./utils/indexer";
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

  let indexer: Contract<FactorySource["Indexer"]>;
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
      contract: "Indexer",
      publicKey: signer?.publicKey as string,
      initParams: {
        _vestingFactory: factoryExpectedAddress,
      },
      constructorParams: {
        codeIndex: indexArtifacts.code,
        indexDeployValue: locklift.utils.toNano(0.2),
        indexDestroyValue: locklift.utils.toNano(0.2),
      },
      value: locklift.utils.toNano(5),
    });
    indexer = _indexer;
    logger.log(`Indexer address: ${indexer.address}`);

    const { codeIndex: _indexCode } = await indexer.methods.getCodeIndex({ answerId: 0 }).call();
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
  it("should deploy single vesting contract and find it by the index codeHash", async function () {
    const start = Math.floor(locklift.testing.getCurrentTime() / 1000) + 15;
    const end = start + 20;
    adminTokenWallet.transfer;

    await token.mint(bn(100).multipliedBy(1e18).toFixed(), user1);

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

    // @ts-ignore
    const event = (
      await factory.getPastEvents({
        filter: event => event.event === "NewVesting",
      })
    ).events.shift() as any;
    expect(event.data.user.toString()).to.be.eq(user0.address.toString());
    expect(event.data.creator.toString()).to.be.eq(user1.address.toString());

    const userIndexCodeHash = await validateIndexCodeHash(
      indexer,
      indexCode,
      factory.address,
      user0.address,
      0,
      0,
    );
    const userIndexes = await validateIndexesAmount(userIndexCodeHash, 1);
    const userIndexAddress = await validateIndexAddress(
      indexer,
      userIndexes[0],
      event.data.vesting,
      user0.address,
      0,
      0,
    );
    await validateIndexInfo(userIndexAddress, factory.address, event.data.vesting, user0.address);

    const creatorIndexCodeHash = await validateIndexCodeHash(
      indexer,
      indexCode,
      factory.address,
      user1.address,
      1,
      0,
    );
    const creatorIndexes = await validateIndexesAmount(creatorIndexCodeHash, 1);
    const creatorIndexAddress = await validateIndexAddress(
      indexer,
      creatorIndexes[0],
      event.data.vesting,
      user1.address,
      1,
      0,
    );
    await validateIndexInfo(creatorIndexAddress, factory.address, event.data.vesting, user1.address);

    const tokenIndexCodeHash = await validateIndexCodeHash(
      indexer,
      indexCode,
      factory.address,
      token.address,
      2,
      0,
    );

    const tokenIndexes = await validateIndexesAmount(tokenIndexCodeHash, 1);
    const tokenIndexAddress = await validateIndexAddress(
      indexer,
      tokenIndexes[0],
      event.data.vesting,
      token.address,
      2,
      0,
    );
    await validateIndexInfo(tokenIndexAddress, factory.address, event.data.vesting, token.address);
  });
  it("the same user deploys 3 vesting contracts with the same params", async function () {
    const start = Math.floor(locklift.testing.getCurrentTime() / 1000) + 15;
    const end = start + 20;
    adminTokenWallet.transfer;

    await token.mint(bn(100).multipliedBy(1e18).toFixed(), user1);

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
          user: user0.address,
          token: token.address,
          vesting_amount: bn(100).multipliedBy(1e18).toFixed(),
          vesting_start: start,
          vesting_end: end,
        })
        .send({ from: user1.address, amount: locklift.utils.toNano(2.5) }),
    );

    const userIndexCodeHash = await getSaltedCodeHash(indexCode, factory.address, user0.address, 0, 0);
    const creatorIndexCodeHash = await getSaltedCodeHash(indexCode, factory.address, user1.address, 1, 0);
    const tokenIndexCodeHash = await getSaltedCodeHash(indexCode, factory.address, token.address, 2, 0);

    await validateIndexesAmount(creatorIndexCodeHash, 3);
    await validateIndexesAmount(userIndexCodeHash, 3);
    await validateIndexesAmount(tokenIndexCodeHash, 3);
  });
  it("user1 creates 2 vestings, user0 creates 1, the same token", async function () {
    const start = Math.floor(locklift.testing.getCurrentTime() / 1000) + 15;
    const end = start + 20;
    adminTokenWallet.transfer;

    await token.mint(bn(100).multipliedBy(1e18).toFixed(), user1);

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
          user: user1.address,
          token: token.address,
          vesting_amount: bn(100).multipliedBy(1e18).toFixed(),
          vesting_start: start,
          vesting_end: end,
        })
        .send({ from: user0.address, amount: locklift.utils.toNano(2.5) }),
    );

    const userIndexCodeHash = await getSaltedCodeHash(indexCode, factory.address, user0.address, 0, 0);
    const creatorIndexCodeHash = await getSaltedCodeHash(indexCode, factory.address, user1.address, 1, 0);
    const tokenIndexCodeHash = await getSaltedCodeHash(indexCode, factory.address, token.address, 2, 0);

    await validateIndexesAmount(creatorIndexCodeHash, 2);
    await validateIndexesAmount(userIndexCodeHash, 2);
    await validateIndexesAmount(tokenIndexCodeHash, 3);
  });
});

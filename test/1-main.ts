import { Contract, getRandomNonce, lockliftChai, toNano } from "locklift";
import { Account } from "locklift/everscale-client";
import { VestingAbi, VestingFactoryAbi } from "../build/factorySource";
import {
  bn,
  deployUser,
  setupTokenRoot,
  tryIncreaseTime,
} from "./utils/common";
import { Token } from "./utils/wrappers/token";
import { TokenWallet } from "./utils/wrappers/token_wallet";

import chai, { expect } from "chai";

const logger = require("mocha-logger");
chai.use(lockliftChai);

describe("Test linear vesting contract", async function () {
  this.timeout(100000000);

  let factory: Contract<VestingFactoryAbi>;
  let user: Account;
  let userTokenWallet: TokenWallet;
  let admin: Account;
  let adminTokenWallet: TokenWallet;
  let token: Token;
  let vesting_amount = 1_000_000_000;
  let vesting: Contract<VestingAbi>;
  let vestingTokenWallet: TokenWallet;
  let admin_initial_bal = 1_000_000_000_000;
  let period: number;
  let start: number;
  let end: number;
  let user_bal_cumulative = bn(0);
  let factoryDeployNonce = getRandomNonce();

  describe("Setup basic contracts", async function () {
    it("Deploy users", async function () {
      user = await deployUser();
      admin = await deployUser();
    });
    it("Deploy factory", async function () {
      admin = await deployUser(10);
      const signer = await locklift.keystore.getSigner("0");

      const Vesting = locklift.factory.getContractArtifacts("Vesting");
      const Index = locklift.factory.getContractArtifacts("Index");
      const NativeVesting =
        locklift.factory.getContractArtifacts("NativeVesting");

      const { contract: _contract } = await locklift.tracing.trace(
        locklift.factory.deployContract({
          contract: "VestingFactory",
          constructorParams: {
            indexCode: Index.code,
            indexDeployValue: toNano(0.1),
            indexDestroyValue: toNano(0.1),
          },
          initParams: {
            nativeVestingCode: NativeVesting.code,
            vestingCode: Vesting.code,
            deploy_nonce: factoryDeployNonce,
          },
          value: toNano(5),
          publicKey: signer?.publicKey as string,
        }),
      );
      factory = _contract;

      logger.log(`Factory address: ${factory.address}`);
    });

    it("Deploy token", async function () {
      token = await setupTokenRoot("Wrapped Venom", "WVENOM", user);
      await token.mint(admin_initial_bal, admin);
      adminTokenWallet = await token.wallet(admin);
      userTokenWallet = await token.wallet(user);
    });
  });

  describe("Test vesting", async function () {
    it("Deploy vesting", async function () {
      start = Math.floor(locklift.testing.getCurrentTime() / 1000) + 15;
      end = start + 20;
      period = end - start;

      await locklift.tracing.trace(
        factory.methods
          .deployVesting({
            user: user.address,
            remainingGasTo: user.address,
            token: token.address,
            vesting_amount: vesting_amount,
            vesting_start: start,
            vesting_end: end,
          })
          .send({ from: user.address, amount: toNano(3) }),
      );

      // @ts-ignore
      const event = (
        await factory.getPastEvents({
          filter: event => event.event === "NewVesting",
        })
      ).events.shift() as any;
      expect(event.data.user.toString()).to.be.eq(user.address.toString());

      vesting = await locklift.factory.getDeployedContract(
        "Vesting",
        event.data.vesting,
      );
      vestingTokenWallet = await token.wallet({
        address: vesting.address,
      } as Account);
      logger.log(`Vesting address - ${vesting.address}`);
    });

    it("Send bad token amount to vesting", async function () {
      const bad_amount = 123;
      const { traceTree } = await locklift.tracing.trace(
        adminTokenWallet.transfer(bad_amount, vesting.address, "", toNano(1)),
      );
      // await traceTree?.beautyPrint();
      expect(traceTree).to.emit("BadDeposit").withNamedArgs({
        sender: admin.address,
        amount: bad_amount.toFixed(),
      });

      // check funds not sent
      const admin_bal = await adminTokenWallet.balance();
      expect(admin_bal.toString()).to.be.eq(
        admin_initial_bal.toString(),
        "Bad tokens lost",
      );
    });

    it("Send correct token amount", async function () {
      const { traceTree } = await locklift.tracing.trace(
        adminTokenWallet.transfer(
          vesting_amount,
          vesting.address,
          "",
          toNano(1),
        ),
      );
      expect(traceTree).to.emit("Deposit").withNamedArgs({
        sender: admin.address,
        amount: vesting_amount.toFixed(),
      });
      const details = await vesting.methods.getDetails({}).call();
      expect(details._filled).to.be.eq(true, "Not filled");
      expect(details._tokenBalance.toString()).to.be.eq(
        vesting_amount.toString(),
        "Bad token balance",
      );
    });

    it("Send redundant tokens", async function () {
      const admin_bal_before = await adminTokenWallet.balance();

      const { traceTree } = await locklift.tracing.trace(
        adminTokenWallet.transfer(
          vesting_amount,
          vesting.address,
          "",
          toNano(1),
        ),
      );
      expect(traceTree).to.emit("BadDeposit").withNamedArgs({
        sender: admin.address,
        amount: vesting_amount.toFixed(),
      });
      // check funds not sent
      const admin_bal = await adminTokenWallet.balance();
      expect(admin_bal.toString()).to.be.eq(
        admin_bal_before.toString(),
        "Bad tokens lost",
      );
    });

    it("User claims", async function () {
      await tryIncreaseTime(20);

      const { traceTree } = await locklift.tracing.trace(
        vesting.methods
          .claim({})
          .send({ from: user.address, amount: toNano(2) }),
      );

      const details = await vesting.methods.getDetails({}).call();
      const claim_time = Number(details._lastClaimTime);
      const vesting_start = Number(details._vestingStart);
      const passed = claim_time - vesting_start;

      const amount = Math.floor((vesting_amount * passed) / period);
      logger.log(
        `Time passed - ${passed} (${((passed / period) * 100).toPrecision(
          2,
        )}%), tokens should be paid - ${amount}`,
      );

      const vesting_bal = await vestingTokenWallet.balance();
      expect(traceTree).to.emit("Claim").withNamedArgs({
        amount: amount.toFixed(),
        remaining_amount: vesting_bal.toString(),
      });
      logger.log(`Remaining balance - ${vesting_start.toString()}`);

      const user_bal = await userTokenWallet.balance();
      expect(user_bal.toString()).to.be.eq(amount.toFixed());
      user_bal_cumulative = bn(user_bal.toString());
    });

    it("User claims again", async function () {
      const prev_details = await vesting.methods.getDetails().call();
      const prev_claim_time = Number(prev_details._lastClaimTime);
      const vesting_balance = Number(prev_details._tokenBalance);

      await tryIncreaseTime(5);

      const { traceTree } = await locklift.tracing.trace(
        vesting.methods
          .claim({})
          .send({ from: user.address, amount: toNano(2) }),
      );

      const details = await vesting.methods.getDetails().call();
      const claim_time = Number(details._lastClaimTime);
      const period = end - prev_claim_time;
      const passed = claim_time - prev_claim_time;

      const amount = Math.floor((vesting_balance * passed) / period);
      logger.log(
        `Time passed - ${passed} (${((passed / period) * 100).toPrecision(
          2,
        )}%), tokens should be paid - ${amount}`,
      );

      const vesting_bal = await vestingTokenWallet.balance();
      expect(traceTree).to.emit("Claim").withNamedArgs({
        amount: amount.toFixed(),
        remaining_amount: vesting_bal.toString(),
      });

      const user_bal = await userTokenWallet.balance();
      user_bal_cumulative = user_bal_cumulative.plus(bn(amount.toFixed()));
      expect(user_bal.toString()).to.be.eq(
        user_bal_cumulative.toString(),
        "User not paid",
      );
    });

    it("User claims after vesting ends", async function () {
      await tryIncreaseTime(15);

      const prev_details = await vesting.methods.getDetails().call();
      const prev_claim_time = Number(prev_details._lastClaimTime);
      const vesting_balance = Number(prev_details._tokenBalance);

      const { traceTree } = await locklift.tracing.trace(
        vesting.methods
          .claim({})
          .send({ from: user.address, amount: toNano(2) }),
      );

      const details = await vesting.methods.getDetails().call();
      const claim_time = Number(details._lastClaimTime);
      const period = end - prev_claim_time;
      const passed = claim_time - prev_claim_time;

      const amount = vesting_balance;
      logger.log(
        `Time passed - ${passed} (${((passed / period) * 100).toPrecision(
          2,
        )}%), tokens should be paid - ${amount}`,
      );

      const vesting_bal = await vestingTokenWallet.balance();
      expect(traceTree).to.emit("Claim").withNamedArgs({
        amount: amount.toFixed(),
        remaining_amount: vesting_bal.toString(),
      });

      const user_bal = await userTokenWallet.balance();
      user_bal_cumulative = user_bal_cumulative.plus(bn(amount.toFixed()));
      expect(user_bal.toString()).to.be.eq(
        user_bal_cumulative.toString(),
        "User not paid",
      );

      expect(traceTree).to.emit("Vested");

      expect(details._vested).to.be.eq(true, "Not vested");
      expect(details._tokenBalance.toString()).to.be.eq("0", "Bad balance");
    });
  });
});

import { Contract, getRandomNonce, lockliftChai, toNano } from "locklift";
import { Account } from "locklift/everscale-client";
import { NativeVestingAbi, VestingFactoryAbi } from "../build/factorySource";
import { bn, deployUser, tryIncreaseTime } from "./utils/common";

import chai, { expect } from "chai";

const logger = require("mocha-logger");
chai.use(lockliftChai);

describe("Test native linear vesting contract", async function () {
  this.timeout(100000000);

  let factory: Contract<VestingFactoryAbi>;
  let user: Account;
  let admin: Account;
  let vesting_amount = toNano(10);
  let vesting: Contract<NativeVestingAbi>;
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
  });

  describe("Test native vesting", async function () {
    it("Deploy vesting", async function () {
      start = Math.floor(locklift.testing.getCurrentTime() / 1000) + 15;
      end = start + 20;
      period = end - start;

      await locklift.tracing.trace(
        factory.methods
          .deployNativeVesting({
            user: user.address,
            remainingGasTo: user.address,
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
        "NativeVesting",
        event.data.vesting,
      );
      logger.log(`Vesting address - ${vesting.address}`);
    });

    it("Send correct amount", async function () {
      const { traceTree } = await locklift.tracing.trace(
        vesting.methods.deposit({ send_gas_to: admin.address }).send({
          from: admin.address,
          amount: bn(vesting_amount).plus(toNano(2)).toFixed(),
        }),
      );
      expect(traceTree).to.emit("Deposit").withNamedArgs({
        sender: admin.address,
        amount: vesting_amount,
      });
      const details = await vesting.methods.getDetails({}).call();
      expect(details._filled).to.be.eq(true, "Not filled");
      expect(details._balance.toString()).to.be.eq(
        vesting_amount.toString(),
        "Bad token balance",
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

      const amount = bn(vesting_amount).times(passed).idiv(period);
      logger.log(
        `Time passed - ${passed} (${((passed / period) * 100).toPrecision(
          2,
        )}%), tokens should be paid - ${amount}`,
      );

      expect(traceTree).to.emit("Claim").withNamedArgs({
        amount: amount.toFixed(),
      });

      user_bal_cumulative = bn(amount.toFixed());
    });

    it("User claims again", async function () {
      const prev_details = await vesting.methods.getDetails().call();
      const prev_claim_time = Number(prev_details._lastClaimTime);
      const vesting_balance = Number(prev_details._balance);

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

      const amount = bn(vesting_balance).times(passed).idiv(period);
      logger.log(
        `Time passed - ${passed} (${((passed / period) * 100).toPrecision(
          2,
        )}%), tokens should be paid - ${amount}`,
      );

      expect(traceTree).to.emit("Claim").withNamedArgs({
        amount: amount.toFixed(),
      });
      user_bal_cumulative = user_bal_cumulative.plus(amount.toFixed());
    });

    it("User claims after vesting ends", async function () {
      await tryIncreaseTime(15);

      const prev_details = await vesting.methods.getDetails().call();
      const prev_claim_time = Number(prev_details._lastClaimTime);
      const vesting_balance = Number(prev_details._balance);

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

      expect(traceTree).to.emit("Claim").withNamedArgs({
        amount: amount.toFixed(),
      });

      user_bal_cumulative = user_bal_cumulative.plus(bn(amount.toFixed()));
      expect(user_bal_cumulative.toFixed()).to.be.eq(vesting_amount);

      expect(traceTree).to.emit("Vested");

      expect(details._vested).to.be.eq(true, "Not vested");
      expect(details._balance.toString()).to.be.eq("0", "Bad balance");
    });
  });
});

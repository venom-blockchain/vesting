const logger = require('mocha-logger');
const { expect, version} = require('chai');
const BigNumber = require('bignumber.js');
const {
    convertCrystal
} = locklift.utils;

const { setupTokenRoot, deployUser, sleep} = require('./utils');

describe('Test linear vesting contract', async function() {
   this.timeout(100000000);

   let factory;
   let user;
   let userTokenWallet;
   let admin;
   let adminTokenWallet;
   let token;
   let vesting_amount = 1_000_000_000;
   let vesting;
   let vestingTokenWallet;
   let admin_initial_bal = 1_000_000_000_000;
   let period;
   let start;
   let end;
   let user_bal_cumulative;

    describe('Setup basic contracts', async function() {
        it('Deploy factory', async function() {
            const Vesting = await locklift.factory.getContract('Vesting');
            const NativeVesting = await locklift.factory.getContract('NativeVesting');

            const VestingFactory = await locklift.factory.getContract('VestingFactory');
            const [keyPair] = await locklift.keys.getKeyPairs();
            factory = await locklift.giver.deployContract({
                contract: VestingFactory,
                constructorParams: {},
                initParams: {
                    nativeVestingCode: NativeVesting.code,
                    vestingCode: Vesting.code,
                    deploy_nonce: locklift.utils.getRandomNonce()
                },
                keyPair,
            }, convertCrystal(5, 'nano'));

            logger.log(`Factory address: ${factory.address}`);

            const {
                acc_type_name
            } = await locklift.ton.getAccountType(factory.address);

            expect(acc_type_name).to.be.equal('Active', 'Factory account not active');
        });

        it('Deploy users', async function() {
            user = await deployUser();
            admin = await deployUser();
        });

        it('Deploy token', async function() {
            token = await setupTokenRoot('Ever', 'EVER', user);
            await token.mint(admin_initial_bal, admin);
            adminTokenWallet = await token.wallet(admin);
            userTokenWallet = await token.wallet(user);
        });
    });

    describe('Test vesting', async function() {
        start = Math.floor(Date.now() / 1000) + 15;
        end = start + 20;
        period = end - start;

        it('Deploy vesting', async function() {
            const tx = await user.runTarget({
                contract: factory,
                method: 'deployVesting',
                params: {
                    user: user.address,
                    token: token.address,
                    vesting_amount: vesting_amount,
                    vesting_start: start,
                    vesting_end: end
                },
                value: convertCrystal(2.5, 'nano')
            });

            // console.log(tx.transaction.out_msgs);

            const {
                value: {
                    vesting: _vesting,
                    user: _user,
                    creator: _creator,
                    token: _token,
                    amount: _amount,
                    start: _start,
                    end: _end
                }
            } = (await factory.getEvents('NewVesting')).pop();
            expect(_user).to.be.eq(user.address, "Bad user");

            vesting = await locklift.factory.getContract('Vesting');
            vesting.setAddress(_vesting);
            logger.log(`Vesting address - ${vesting.address}`);

            vestingTokenWallet = await token.wallet(vesting);
        });

        it('Send bad token amount to vesting', async function() {
            const bad_amount = 123;
            const tx = await adminTokenWallet.transfer(bad_amount, vesting.address);

            await sleep(1000);
            // console.log(tx.transaction.out_msgs);

            const {
                value: {
                    sender: _sender,
                    amount: _amount
                }
            } = (await vesting.getEvents('BadDeposit')).pop();
            expect(_sender).to.be.eq(admin.address, "Bad sender");
            expect(_amount.toString()).to.be.eq(bad_amount.toString(), "Bad amount");

            // check funds not sent
            const admin_bal = await adminTokenWallet.balance();
            expect(admin_bal.toString()).to.be.eq(admin_initial_bal.toString(), "Bad tokens lost");
        });

        it('Send correct token amount', async function() {
            const tx = await adminTokenWallet.transfer(vesting_amount, vesting.address);
            await sleep(1000);
            const {
                value: {
                    sender: _sender,
                    amount: _amount
                }
            } = (await vesting.getEvents('Deposit')).pop();
            expect(_sender).to.be.eq(admin.address, "Bad sender");
            expect(_amount.toString()).to.be.eq(vesting_amount.toString(), "Bad amount");

            const details = await vesting.call({method: 'getDetails'});
            expect(details._filled).to.be.eq(true, 'Not filled');
            expect(details._tokenBalance.toString()).to.be.eq(vesting_amount.toString(), 'Bad token balance');
        });

        it('Send redundant tokens', async function() {
            const admin_bal_before = await adminTokenWallet.balance();
            const tx = await adminTokenWallet.transfer(vesting_amount, vesting.address);
            await sleep(1000);
            const {
                value: {
                    sender: _sender,
                    amount: _amount
                }
            } = (await vesting.getEvents('BadDeposit')).pop();
            expect(_sender).to.be.eq(admin.address, "Bad sender");
            expect(_amount.toString()).to.be.eq(vesting_amount.toString(), "Bad amount");

            // check funds not sent
            const admin_bal = await adminTokenWallet.balance();
            expect(admin_bal.toString()).to.be.eq(admin_bal_before.toString(), "Bad tokens lost");
        });

        it('User claims', async function() {
           const tx = await user.runTarget({
               contract: vesting,
               method: 'claim',
               params: {},
               value: convertCrystal(2 ,'nano')
           });

            const details = await vesting.call({method: 'getDetails'});
            const claim_time = details._lastClaimTime.toNumber();
            const vesting_start = details._vestingStart.toNumber();
            const passed = claim_time - vesting_start;

            const amount = Math.floor(vesting_amount * passed / period);
            logger.log(`Time passed - ${passed} (${(passed / period * 100).toPrecision(2)}%), tokens should be paid - ${amount}`);
            const {
                value: {
                    amount: _amount,
                    remaining_amount: _remaining_amount
                }
            } = (await vesting.getEvents('Claim')).pop();
            logger.log(`Remaining balance - ${_remaining_amount.toString()}`);

            expect(_amount.toString()).to.be.eq(amount.toString(), "Bad vested");

            const user_bal = await userTokenWallet.balance();
            expect(user_bal.toString()).to.be.eq(_amount.toString(), "User not paid");
            user_bal_cumulative = BigInt(user_bal.toString());

            const vesting_bal = await vestingTokenWallet.balance();
            expect(vesting_bal.toString()).to.be.eq(_remaining_amount.toString(), "Bad vesting balance");
        });

        it('User claims again', async function() {
            const prev_details = await vesting.call({method: 'getDetails'});
            const prev_claim_time = prev_details._lastClaimTime.toNumber();
            const vesting_balance = prev_details._tokenBalance;

            await sleep(5000);

            const tx = await user.runTarget({
                contract: vesting,
                method: 'claim',
                params: {},
                value: convertCrystal(2 ,'nano')
            });

            const details = await vesting.call({method: 'getDetails'});
            const claim_time = details._lastClaimTime.toNumber();
            const period = end - prev_claim_time;
            const passed = claim_time - prev_claim_time;

            const amount = Math.floor(vesting_balance * passed / period);
            logger.log(`Time passed - ${passed} (${(passed / period * 100).toPrecision(2)}%), tokens should be paid - ${amount}`);
            const {
                value: {
                    amount: _amount,
                    remaining_amount: _remaining_amount
                }
            } = (await vesting.getEvents('Claim')).pop();

            expect(_amount.toString()).to.be.eq(amount.toString(), "Bad vested");

            const user_bal = await userTokenWallet.balance();
            user_bal_cumulative = user_bal_cumulative + BigInt(amount);
            expect(user_bal.toString()).to.be.eq(user_bal_cumulative.toString(), "User not paid");

            const vesting_bal = await vestingTokenWallet.balance();
            expect(vesting_bal.toString()).to.be.eq(_remaining_amount.toString(), "Bad vesting balance");
        });

        it('User claims after vesting ends', async function() {
            await sleep(15000);
            const prev_details = await vesting.call({method: 'getDetails'});
            const prev_claim_time = prev_details._lastClaimTime.toNumber();
            const vesting_balance = prev_details._tokenBalance;

            const tx = await user.runTarget({
                contract: vesting,
                method: 'claim',
                params: {},
                value: convertCrystal(2 ,'nano')
            });

            const details = await vesting.call({method: 'getDetails'});
            const claim_time = details._lastClaimTime.toNumber();
            const period = end - prev_claim_time;
            const passed = claim_time - prev_claim_time;

            const amount = vesting_balance;
            logger.log(`Time passed - ${passed} (${(passed / period * 100).toPrecision(2)}%), tokens should be paid - ${amount}`);

            const {
                value: {
                    amount: _amount,
                    remaining_amount: _remaining_amount
                }
            } = (await vesting.getEvents('Claim')).pop();

            expect(_amount.toString()).to.be.eq(amount.toString(), "Bad vested");

            const user_bal = await userTokenWallet.balance();
            user_bal_cumulative = user_bal_cumulative + BigInt(amount);
            expect(user_bal.toString()).to.be.eq(user_bal_cumulative.toString(), "User not paid");

            const vesting_bal = await vestingTokenWallet.balance();
            expect(vesting_bal.toString()).to.be.eq(_remaining_amount.toString(), "Bad vesting balance");

            const {
                value: {}
            } = (await vesting.getEvents('Vested')).pop();
            expect(details._vested).to.be.eq(true, 'Not vested');
            expect(details._tokenBalance.toString()).to.be.eq('0', 'Bad balance');
        });
    });
});
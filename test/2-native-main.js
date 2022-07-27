const logger = require('mocha-logger');
const { expect, version} = require('chai');
const BigNumber = require('bignumber.js');
const {
    convertCrystal
} = locklift.utils;

const { setupTokenRoot, deployUser, sleep} = require('./utils');

describe('Test native linear vesting contract', async function() {
   this.timeout(100000000);

   let factory;
   let user;
   let admin;
   let vesting_amount = 10;
   let vesting;
   let period;
   let start;
   let end;
   let user_bal_cumulative;

    describe('Setup basic contracts', async function() {
        it('Deploy factory', async function() {
            const NativeVesting = await locklift.factory.getContract('NativeVesting');
            const Vesting = await locklift.factory.getContract('Vesting');

            const VestingFactory = await locklift.factory.getContract('VestingFactory');
            const [keyPair] = await locklift.keys.getKeyPairs();
            factory = await locklift.giver.deployContract({
                contract: VestingFactory,
                constructorParams: {},
                initParams: {
                    vestingCode: Vesting.code,
                    nativeVestingCode: NativeVesting.code,
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
    });

    describe('Test native vesting', async function() {
        it('Deploy vesting', async function() {
            start = Math.floor(Date.now() / 1000) + 10;
            end = start + 20;
            period = end - start;

            const tx = await user.runTarget({
                contract: factory,
                method: 'deployNativeVesting',
                params: {
                    user: user.address,
                    vesting_amount: vesting_amount,
                    vesting_start: start,
                    vesting_end: end
                },
                value: convertCrystal(2.5, 'nano')
            });

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
            console.log(_token);

            vesting = await locklift.factory.getContract('NativeVesting');
            vesting.setAddress(_vesting);
            logger.log(`Vesting address - ${vesting.address}`);
        });

        it('Send correct amount', async function() {
            const tx = await admin.runTarget({
                contract: vesting,
                method: 'deposit',
                params: {
                    send_gas_to: admin.address
                },
                value: convertCrystal(vesting_amount + 1.5)
            })
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
            expect(details._balance.toString()).to.be.eq(vesting_amount.toString(), 'Bad token balance');
        });


        it('User claims', async function() {
            await sleep(5000);

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

            console.log(_amount, amount);
            expect(_amount.toString()).to.be.eq(amount.toString(), "Bad vested");
            //
            // const user_bal = await userTokenWallet.balance();
            // expect(user_bal.toString()).to.be.eq(_amount.toString(), "User not paid");
            // user_bal_cumulative = BigInt(user_bal.toString());
            //
            // const vesting_bal = await vestingTokenWallet.balance();
            // expect(vesting_bal.toString()).to.be.eq(_remaining_amount.toString(), "Bad vesting balance");
        });

        it('User claims again', async function() {
            const prev_details = await vesting.call({method: 'getDetails'});
            const prev_claim_time = prev_details._lastClaimTime.toNumber();
            const vesting_balance = prev_details._balance;

            await sleep(1000);

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
        });

        it('User claims after vesting ends', async function() {
            await sleep(5000);
            const prev_details = await vesting.call({method: 'getDetails'});
            const prev_claim_time = prev_details._lastClaimTime.toNumber();
            const vesting_balance = prev_details._balance;

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

            const {
                value: {}
            } = (await vesting.getEvents('Vested')).pop();
            expect(details._vested).to.be.eq(true, 'Not vested');
            expect(details._balance.toString()).to.be.eq('0', 'Bad balance');
        });
    });
});
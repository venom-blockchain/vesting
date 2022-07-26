const logger = require("mocha-logger");
const {expect} = require("chai");
const {
    convertCrystal
} = locklift.utils;

const isValidTonAddress = (address) => /^(?:-1|0):[0-9a-fA-F]{64}$/.test(address);

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const afterRun = async () => {
    await sleep(1000);
};

const wait_acc_deployed = async function (addr) {
    await locklift.ton.client.net.wait_for_collection({
        collection: 'accounts',
        filter: {
            id: { eq: addr },
            balance: { gt: `0x0` }
        },
        result: 'id'
    });
}


// -------------------------- ENTITIES ----------------------------
class TokenWallet {
    constructor(wallet_contract, wallet_owner) {
        this.wallet = wallet_contract;
        this._owner = wallet_owner;
        this.address = this.wallet.address;
    }

    static async from_addr(addr, owner) {
        let userTokenWallet = await locklift.factory.getContract(
            'TokenWallet',
            'node_modules/broxus-ton-tokens-contracts/build'
        );

        userTokenWallet.setAddress(addr);
        return new TokenWallet(userTokenWallet, owner);
    }

    async owner() {
        return await this.wallet.call({method: 'owner'});
    }

    async root() {
        return await this.wallet.call({method: 'root'});
    }

    async balance() {
        return await this.wallet.call({method: 'balance'});
    }

    async transfer(amount, receiver_or_addr, payload='') {
        let addr = receiver_or_addr.address;
        if (addr === undefined) {
            addr = receiver_or_addr;
        }
        return await this._owner.runTarget({
            contract: this.wallet,
            method: 'transfer',
            params: {
                amount: amount,
                recipient: addr,
                deployWalletValue: 0,
                remainingGasTo: this._owner.address,
                notify: true,
                payload: payload
            },
            value: convertCrystal(5, 'nano')
        });
    }
}


class Token {
    constructor(token_contract, token_owner) {
        this.token = token_contract;
        this.owner = token_owner;
        this.address = this.token.address;
    }

    static async from_addr (addr, owner) {
        const rootToken = await locklift.factory.getContract(
            'TokenRoot',
            'node_modules/broxus-ton-tokens-contracts/build'
        );
        rootToken.setAddress(addr);
        return new Token(rootToken, owner);
    }

    async walletAddr(user_or_addr) {
        let addr = user_or_addr.address;
        if (addr === undefined) {
            addr = user_or_addr;
        }
        return await this.token.call({
            method: 'walletOf',
            params: { walletOwner: addr }
        });
    }

    async wallet(user) {
        const wallet_addr = await this.walletAddr(user);
        return TokenWallet.from_addr(wallet_addr, user);
    }

    async deployWallet(user) {
        await user.runTarget({
            contract: this.token,
            method: 'deployWallet',
            params: {
                answerId: 0,
                walletOwner: user.address,
                deployWalletValue: convertCrystal(1, 'nano'),
            },
            value: convertCrystal(2, 'nano'),
        });
        const addr = await this.walletAddr(user);
        await wait_acc_deployed(addr);

        logger.log(`User token wallet: ${addr}`);
        return TokenWallet.from_addr(addr, user);
    }

    async mint(mint_amount, user) {
        await this.owner.runTarget({
            contract: this.token,
            method: 'mint',
            params: {
                amount: mint_amount,
                recipient: user.address,
                deployWalletValue: convertCrystal(1, 'nano'),
                remainingGasTo: this.owner.address,
                notify: false,
                payload: ''
            },
            value: convertCrystal(3, 'nano'),
        });

        const walletAddr = await this.walletAddr(user);

        await wait_acc_deployed(walletAddr);

        logger.log(`User token wallet: ${walletAddr}`);
        return TokenWallet.from_addr(walletAddr, user);
    }
}


const setupTokenRoot = async function(token_name, token_symbol, owner) {
    const RootToken = await locklift.factory.getContract(
        'TokenRoot',
        'node_modules/broxus-ton-tokens-contracts/build'
    );

    const TokenWallet = await locklift.factory.getContract(
        'TokenWallet',
        'node_modules/broxus-ton-tokens-contracts/build'
    );

    const [keyPair] = await locklift.keys.getKeyPairs();

    const _root = await locklift.giver.deployContract({
        contract: RootToken,
        constructorParams: {
            initialSupplyTo: locklift.utils.zeroAddress,
            initialSupply: 0,
            deployWalletValue: 0,
            mintDisabled: false,
            burnByRootDisabled: false,
            burnPaused: false,
            remainingGasTo: owner.address
        },
        initParams: {
            name_: token_name,
            symbol_: token_symbol,
            decimals_: 9,
            rootOwner_: owner.address,
            walletCode_: TokenWallet.code,
            randomNonce_: locklift.utils.getRandomNonce(),
            deployer_: locklift.utils.zeroAddress
        },
        keyPair,
    });
    _root.afterRun = afterRun;
    _root.setKeyPair(keyPair);

    logger.log(`Token root address: ${_root.address}`);

    const name = await _root.call({
        method: 'name',
        params: {}
    });

    expect(name.toString()).to.be.equal(token_name, 'Wrong root name');
    expect((await locklift.ton.getBalance(_root.address)).toNumber()).to.be.above(0, 'Root balance empty');
    return new Token(_root, owner);
}


const deployUser = async function() {
    const [keyPair] = await locklift.keys.getKeyPairs();
    const Account = await locklift.factory.getAccount('Wallet');
    const _user = await locklift.giver.deployContract({
        contract: Account,
        constructorParams: {},
        initParams: {
            _randomNonce: locklift.utils.getRandomNonce()
        },
        keyPair,
    }, convertCrystal(50, 'nano'));

    _user.afterRun = afterRun;

    _user.setKeyPair(keyPair);

    const userBalance = await locklift.ton.getBalance(_user.address);

    expect(userBalance.toNumber()).to.be.above(0, 'Bad user balance');

    logger.log(`User address: ${_user.address}`);

    const {
        acc_type_name
    } = await locklift.ton.getAccountType(_user.address);

    expect(acc_type_name).to.be.equal('Active', 'User account not active');
    return _user;
}


module.exports = {
    deployUser,
    setupTokenRoot,
    sleep,
    isValidTonAddress
}
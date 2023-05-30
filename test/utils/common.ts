import { Token } from "./wrappers/token";
import { Address, Contract, getRandomNonce, toNano, WalletTypes, zeroAddress } from "locklift";
import { Account } from "locklift/everscale-client";
import Bignumber from "bignumber.js";

const logger = require("mocha-logger");
const { expect } = require("chai");

export const isValidEverAddress = (address: string) => /^(?:-1|0):[0-9a-fA-F]{64}$/.test(address);

export async function sleep(ms = 1000) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function tryIncreaseTime(seconds: number) {
    // @ts-ignore
    if (locklift.testing.isEnabled) {
        await locklift.testing.increaseTime(seconds);
    } else {
        await sleep(seconds * 1000);
    }
}

export function bn(num: number | string) {
    return new Bignumber(num);
}

// -------------------------- ENTITIES ----------------------------

export const setupTokenRoot = async function (token_name: string, token_symbol: string, owner: Account, decimals = 9) {
    const signer = await locklift.keystore.getSigner("0");
    const TokenPlatform = await locklift.factory.getContractArtifacts("TokenWalletPlatform");

    const TokenWallet = await locklift.factory.getContractArtifacts("TokenWalletUpgradeable");
    const { contract: _root, tx } = await locklift.tracing.trace(
        locklift.factory.deployContract({
            contract: "TokenRootUpgradeable",
            initParams: {
                name_: token_name,
                symbol_: token_symbol,
                decimals_: decimals,
                rootOwner_: owner.address,
                walletCode_: TokenWallet.code,
                randomNonce_: getRandomNonce(),
                deployer_: zeroAddress,
                platformCode_: TokenPlatform.code,
            },
            publicKey: signer?.publicKey as string,
            constructorParams: {
                initialSupplyTo: zeroAddress,
                initialSupply: 0,
                deployWalletValue: 0,
                mintDisabled: false,
                burnByRootDisabled: false,
                burnPaused: false,
                remainingGasTo: owner.address,
            },
            value: locklift.utils.toNano(2),
        }),
    );

    logger.log(`Token root address: ${_root.address.toString()}`);

    expect(Number(await locklift.provider.getBalance(_root.address))).to.be.above(0, "Root balance empty");
    return new Token(_root, owner);
};

export const deployUser = async function (initial_balance = 100, user_name = "User"): Promise<Account> {
    const signer = await locklift.keystore.getSigner("0");

    const { account: _user, tx } = await locklift.factory.accounts.addNewAccount({
      type: WalletTypes.MsigAccount,
      mSigType: "SafeMultisig",
      contract: "Wallet",
      //Value which will send to the new account from a giver
      value: toNano(initial_balance),
      publicKey: signer?.publicKey as string,
      initParams: {
        _randomNonce: getRandomNonce(),
      },
      constructorParams: {},
    });

    logger.log(`${user_name} address: ${_user.address.toString()}`);
    return _user;
};

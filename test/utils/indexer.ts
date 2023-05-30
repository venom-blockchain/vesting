import { Address, Contract } from "locklift";
import { FactorySource } from "../../build/factorySource";
import { bn } from "./common";

const { expect } = require("chai");
const logger = require("mocha-logger");

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

export async function validateIndexInfo(
    index: Address,
    expectedFactory: Address,
    expectedVestingContract: Address,
    expectedAccount: Address,
) {
    const indexContract = locklift.factory.getDeployedContract("Index", index);

    const info = await indexContract.methods.getInfo({ answerId: 0 }).call();

    expect(info.acc.toString()).to.be.equal(expectedAccount.toString());
    expect(info.vestingFactory.toString()).to.be.equal(expectedFactory.toString());
    expect(info.vestingContract.toString()).to.be.equal(expectedVestingContract.toString());
}

export async function validateIndexesAmount(indexCodeHash: string, expectedAmount: number): Promise<Address[]> {
    const indexes = (await locklift.provider.getAccountsByCodeHash({ codeHash: indexCodeHash })).accounts;

    expect(indexes.length).to.be.equal(expectedAmount);
    return indexes;
}

export async function validateIndexCodeHash(
    indexer: Contract<FactorySource["Indexer"]>,
    indexCode: string,
    factory: Address,
    acc: Address,
    indexType: 0 | 1 | 2,
    vestingContractType: 0 | 1,
) {
    const codeHash = await getSaltedCodeHash(indexCode, factory, acc, indexType, vestingContractType);
    const { codeHash: codeHashResolved } = await indexer.methods
        .resolveIndexCodeHash({
            answerId: 0,
            acc: acc,
            indexType: indexType,
            vestingContractType: vestingContractType,
        })
        .call();

    expect("0x" + bn(codeHashResolved).toString(16)).to.be.eq(codeHash);
    return codeHash;
}
export async function validateIndexAddress(
    indexer: Contract<FactorySource["Indexer"]>,
    expectedIndex: Address,
    vestingContract: Address,
    acc: Address,
    indexType: 0 | 1 | 2,
    vestingContractType: 0 | 1,
) {
    const { index: indexAddress } = await indexer.methods
        .resolveIndexAddress({
            answerId: 0,
            acc: acc,
            indexType: indexType,
            vestingContractType: vestingContractType,
            vestingContract: vestingContract,
        })
        .call();

    expect(indexAddress.toString()).to.be.eq(expectedIndex.toString());
    return indexAddress;
}

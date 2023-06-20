import fs from "fs";
import { Address, Contract } from "locklift";
import { IDeployArtifacts } from "../../artifacts/artifacts";
import { FactorySource } from "../../build/factorySource";

function saveArrayAsJson(array: any[], filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, JSON.stringify(array, null, 2), err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function readArrayFromJson(filePath: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf-8", (err, data) => {
      if (err) {
        if (err.code === "ENOENT") {
          resolve([]);
        } else {
          reject(err);
        }
      } else {
        try {
          const array = JSON.parse(data);
          resolve(array);
        } catch (err) {
          reject(err);
        }
      }
    });
  });
}

async function deployVestingIndexes(
  indexer: Contract<FactorySource["Indexer"]>,
  indexerOwner: Address,
  vestingAddress: Address,
) {
  const contractType = 0;

  const vesting = locklift.factory.getDeployedContract("Vesting", vestingAddress);

  const details = await vesting.methods.getDetails({}).call();
  console.log("details", details);

  // Deploy recipient index
  await indexer.methods
    .deployIndex({
      indexType: 0,
      acc: details._user,
      vestingContractType: contractType,
      vestingContract: vestingAddress,
    })
    .send({ from: indexerOwner, amount: locklift.utils.toNano(0.25) });

  // Deploy creator index
  await indexer.methods
    .deployIndex({
      indexType: 1,
      acc: details._creator,
      vestingContractType: contractType,
      vestingContract: vestingAddress,
    })
    .send({ from: indexerOwner, amount: locklift.utils.toNano(0.25) });

  // Deploy token index
  await indexer.methods
    .deployIndex({
      indexType: 2,
      acc: details._token,
      vestingContractType: contractType,
      vestingContract: vestingAddress,
    })
    .send({ from: indexerOwner, amount: locklift.utils.toNano(0.25) });
}

async function deployNativeVestingIndexes(
  indexer: Contract<FactorySource["Indexer"]>,
  indexerOwner: Address,
  vestingContract: Address,
) {
  const contractType = 1;

  const vesting = locklift.factory.getDeployedContract("NativeVesting", vestingContract);
  const details = await vesting.methods.getDetails({}).call();

  // Deploy recipient index
  await indexer.methods
    .deployIndex({
      indexType: 0,
      acc: details._user,
      vestingContractType: contractType,
      vestingContract: vestingContract,
    })
    .send({ from: indexerOwner, amount: locklift.utils.toNano(0.25) });

  // Deploy creator index
  await indexer.methods
    .deployIndex({
      indexType: 1,
      acc: details._creator,
      vestingContractType: contractType,
      vestingContract: vestingContract,
    })
    .send({ from: indexerOwner, amount: locklift.utils.toNano(0.25) });
}

async function main() {
  const indexerOwner = new Address(""); // todo: add indexer owner address

  const artifacts = locklift.deployArtifacts.getArtifacts<IDeployArtifacts>();
  const vestingFactory = artifacts.test.Indexer.IndexerForExistingVesting.v1.initParams._vestingFactory;

  const indexer = locklift.deployArtifacts.getContract(artifacts.test.Indexer.IndexerForExistingVesting.v1);

  const vestingAddresses = await readArrayFromJson("./script/reindex/data/vestingAccs.json");
  const nativeVestingAddresses = await readArrayFromJson("./script/reindex/data/nativeVestingAccs.json");

  const vestingWithDeployedIndexes: any[] = [];
  for (const addr of vestingAddresses) {
    try {
      await deployVestingIndexes(indexer, indexerOwner, addr);
      console.log("indexes were deployed for vesting:", addr);
    } catch (err) {
      console.log(err);
      vestingWithDeployedIndexes.push(addr);
    }
  }
  await saveArrayAsJson(vestingWithDeployedIndexes, "./script/reindex/data/vestingAccsWithIndexes.json");

  const nativeVestingWithDeployedIndexes: any[] = [];
  for (const addr of nativeVestingAddresses) {
    try {
      await deployNativeVestingIndexes(indexer, indexerOwner, addr);
      console.log("indexes were deployed for native vesting:", addr);
    } catch (err) {
      console.log(err);
      nativeVestingWithDeployedIndexes.push(addr);
    }
  }
  await saveArrayAsJson(vestingWithDeployedIndexes, "./script/reindex/data/nativeVestingAccsWithIndexes.json");
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.log(e);
    process.exit(1);
  });

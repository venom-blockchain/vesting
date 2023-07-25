import { Address } from "locklift";

export async function getUserIndexSaltedCodeHash(
  indexFactory: Address,
  indexCode: string,
  indexName: "recipient" | "creator",
  contractType: "Vesting" | "NativeVesting",
  user: Address,
): Promise<string> {
  const saltValuePacked = await locklift.provider.packIntoCell({
    abiVersion: "2.2",
    structure: [
      { name: "user", type: "address" },
      { name: "contractType", type: "string" },
    ] as const,
    data: {
      user: user,
      contractType: contractType,
    },
  });
  const { hash: saltedCodeHash } = await locklift.provider.setCodeSalt({
    code: indexCode,
    salt: {
      abiVersion: "2.2",
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
    abiVersion: "2.2",
    structure: [{ name: "token", type: "address" }] as const,
    data: {
      token: token,
    },
  });
  const { hash: saltedCodeHash } = await locklift.provider.setCodeSalt({
    code: indexCode,
    salt: {
      abiVersion: "2.2",
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

async function main() {
  // Contracts addresses
  const vestingFactoryAddress = new Address(
    "0:107406d4e9d52fefc50d9c82ea7500f27454f321c8c5deef2ebce469fca20ea7",
  );

  const creator = new Address(
    "0:5a533a7769a0bae38213eb986ac288b578dc902eabbea3df23110cdcde24a79a",
  );

  const recipient = new Address(
    "0:bd4fd31869e0a89d1aa154622961841b4a96af46430fab2e27d5b766b5ead850",
  );

  // you can get contract instance with everscale-inpage-provider.Contract
  const vestingFactory = locklift.factory.getDeployedContract(
    "VestingFactory",
    vestingFactoryAddress,
  );

  // ---------------------------------------------------------------------------
  // Deploy NativeVesting contract with VestingFactory
  // ---------------------------------------------------------------------------
  // setup vesting params
  const start = Math.floor(locklift.testing.getCurrentTime() / 1000) + 15;
  const end = start + 2000;

  // create tx
  const tx = vestingFactory.methods
    .deployNativeVesting({
      user: recipient,
      remainingGasTo: creator, // creator will receive remaining gas
      vesting_amount: locklift.utils.toNano(10),
      vesting_start: start,
      vesting_end: end,
    })
    .send({ from: creator, amount: locklift.utils.toNano(3) });

  // wait for tx finalization
  await locklift.transactions.waitFinalized(tx);
  console.log("tx:", (await tx).id.hash);
  // ---------------------------------------------------------------------------

  // receive index code with VestingFactory contract
  const { value0: indexCode } = await vestingFactory.methods
    .getIndexCode({ answerId: 0 })
    .call();

  // calculate codeHash for all indexes for given acc, accType and vesting contract Type
  const codeHash = await getUserIndexSaltedCodeHash(
    vestingFactoryAddress,
    indexCode,
    "recipient",
    "NativeVesting",
    recipient,
  );
  console.log("codeHash", codeHash);

  // Filter all indexes contracts by given code hash
  const { accounts: indexes } = await locklift.provider.getAccountsByCodeHash({
    codeHash,
  });
  console.log("indexes", indexes);

  // Create instance of the Index contract
  const indexContract = locklift.factory.getDeployedContract(
    "Index",
    indexes[indexes.length - 1],
  );

  // Get native vesting contract address
  const { value0: indexedContract } = await indexContract.methods
    .getIndexedContract({ answerId: 0 })
    .call();
  console.log("indexedContract", indexedContract);

  const vesting = locklift.factory.getDeployedContract(
    "NativeVesting",
    indexedContract,
  );

  const vestingDetails = await vesting.methods.getDetails().call();
  console.log("vestingDetails", vestingDetails);
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.log(e);
    process.exit(1);
  });

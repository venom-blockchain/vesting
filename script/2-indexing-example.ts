import { Address } from "locklift";

export async function calculateAccIndexCodeHash(
  tvcCode: string,
  accType: "recipient" | "creator",
  acc: Address,
  contractType: "Vesting" | "NativeVesting",
): Promise<string> {
  const accPacked = await locklift.provider.packIntoCell({
    abiVersion: "2.1",
    structure: [{ name: "value", type: "address" }] as const,
    data: {
      value: acc,
    },
  });
  const contractTypePacked = await locklift.provider.packIntoCell({
    abiVersion: "2.1",
    structure: [{ name: "value", type: "string" }] as const,
    data: {
      value: contractType,
    },
  });
  const { hash: saltedCodeHash } = await locklift.provider.setCodeSalt({
    code: tvcCode,
    salt: {
      structure: [
        {
          components: [
            { name: "key", type: "string" },
            { name: "valueType", type: "string" },
            { name: "value", type: "cell" },
          ],
          name: "saltParams",
          type: "tuple[]",
        },
      ] as const,
      abiVersion: "2.1",
      data: {
        saltParams: [
          { key: accType, valueType: "address", value: accPacked.boc },
          { key: "contractType", valueType: "string", value: contractTypePacked.boc },
        ],
      },
    },
  });

  return "0x" + saltedCodeHash;
}
export async function calculateTokenIndexCodeHash(tvcCode: string, token: Address): Promise<string> {
  const tokenPacked = await locklift.provider.packIntoCell({
    abiVersion: "2.1",
    structure: [{ name: "value", type: "address" }] as const,
    data: {
      value: token,
    },
  });

  const { hash: saltedCodeHash } = await locklift.provider.setCodeSalt({
    code: tvcCode,
    salt: {
      structure: [
        {
          components: [
            { name: "key", type: "string" },
            { name: "valueType", type: "string" },
            { name: "value", type: "cell" },
          ],
          name: "saltParams",
          type: "tuple[]",
        },
      ] as const,
      abiVersion: "2.1",
      data: {
        saltParams: [{ key: "token", valueType: "address", value: tokenPacked.boc }],
      },
    },
  });

  return "0x" + saltedCodeHash;
}

async function main() {
  // Contracts addresses
  const vestingFactoryAddress = new Address("0:e16b29de9121b6f5ffc3ca0ea64ed4ef7d0d2b308a4137f273b114e2efb5b8e8");
  const indexerAddress = new Address("0:f5963bcb59e788c99959e0d3d61863e51ef63b9a60010fdbb1eed8039f77afaa");

  
  const creator = new Address("0:5a533a7769a0bae38213eb986ac288b578dc902eabbea3df23110cdcde24a79a");
  
  const recipient = new Address("0:bd4fd31869e0a89d1aa154622961841b4a96af46430fab2e27d5b766b5ead850");

  // you can get contract instance with everscale-inpage-provider.Contract
  const indexer = locklift.factory.getDeployedContract("VestingIndexer", indexerAddress);

  // ---------------------------------------------------------------------------
  // Vesting contract was created like this:
  // ---------------------------------------------------------------------------
  // // setup vesting params
  // const start = Math.floor(locklift.testing.getCurrentTime() / 1000) + 15;
  // const end = start + 2000;

  // // create tx
  // const tx = vestingFactory.methods
  //   .deployNativeVesting({
  //     user: recipient,
  //     vesting_amount: locklift.utils.toNano(10),
  //     vesting_start: start,
  //     vesting_end: end,
  //   })
  //   .send({ from: creator, amount: locklift.utils.toNano(2.5) });

  // // wait for tx finalization
  // await locklift.transactions.waitFinalized(tx);
  // console.log("tx:", (await tx).id.hash);
  // ---------------------------------------------------------------------------

  // receive index code with VestingIndexer contract
  const { indexCode } = await indexer.methods.getIndexCode({ answerId: 0 }).call();

  // calculate codeHash for all indexes for given acc, accType and vesting contract Type
  const codeHash = await calculateAccIndexCodeHash(indexCode, "recipient", recipient, "NativeVesting");
  console.log("codeHash", codeHash);

  // Filter all indexes contracts by given code hash
  const { accounts: indexes } = await locklift.provider.getAccountsByCodeHash({ codeHash });
  console.log("indexes", indexes);

  // Create instance of the Index contract
  const indexContract = locklift.factory.getDeployedContract("Index", indexes[0]);

  // Get vesting factory (info.factory) and native vesting contract (info.instance) addresses
  const indexInfo = await indexContract.methods.getInfo({ answerId: 0 }).call();
  console.log("indexInfo", indexInfo);
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.log(e);
    process.exit(1);
  });

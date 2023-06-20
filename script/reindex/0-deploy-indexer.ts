import { Address } from "locklift";

async function main() {
  const vestingFactoryAddress = new Address("0:d19d250ca3a9f461fe05148fa4f84a9cb063dcdaaa1dbebc2faf80d0b31d6ccb");

  const signer = (await locklift.keystore.getSigner("0"))!;

  const indexContract = locklift.factory.getContractArtifacts("Index");
  const { contract: indexer } = await locklift.deployArtifacts.deployContract(
    "IndexerForExistingVesting",
    "latest",
    {
      contract: "Indexer",
      publicKey: signer?.publicKey as string,
      initParams: {
        _vestingFactory: vestingFactoryAddress,
      },
      constructorParams: {
        codeIndex: indexContract.code,
        indexDeployValue: locklift.utils.toNano(0.2),
        indexDestroyValue: locklift.utils.toNano(0.2),
      },
      value: locklift.utils.toNano(5),
    },
    locklift.privateRPC.deployContract,
  );

  console.log("indexer address:", indexer.address.toString());
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.log(e);
    process.exit(1);
  });

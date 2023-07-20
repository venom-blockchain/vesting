async function main() {
  console.log(`Deploying Indexer and Vesting Factory`);
  const signer = (await locklift.keystore.getSigner("0"))!;

  const vestingFactoryContract =
    locklift.factory.getContractArtifacts("VestingFactory");
  const indexContract = locklift.factory.getContractArtifacts("Index");
  const vestingContract = locklift.factory.getContractArtifacts("Vesting");
  const nativeVestingContract =
    locklift.factory.getContractArtifacts("NativeVesting");

  const deployNonce = locklift.utils.getRandomNonce();

  console.log("Deploying VestingFactory");
  const { contract: vestingFactory } =
    await locklift.deployArtifacts.deployContract(
      "VestingFactory",
      "latest",
      {
        contract: "VestingFactory",
        publicKey: signer?.publicKey as string,
        initParams: {
          deploy_nonce: deployNonce,
          nativeVestingCode: nativeVestingContract.code,
          vestingCode: vestingContract.code,
        },
        constructorParams: {
          indexCode: indexContract.code,
          indexDeployValue: locklift.utils.toNano(0.2),
          indexDestroyValue: locklift.utils.toNano(0.2),
        },
        value: locklift.utils.toNano(5),
      },
      locklift.privateRPC.deployContract,
    );

  console.log(`VestingFactory address: ${vestingFactory.address.toString()}`);
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.log(e);
    process.exit(1);
  });

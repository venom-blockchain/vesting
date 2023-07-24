async function main() {
  console.log(`Deploying VestingFactory...`);
  const signer = (await locklift.keystore.getSigner("0"))!;

  const indexArtifacts = locklift.factory.getContractArtifacts("Index");
  const vestingArtifacts = locklift.factory.getContractArtifacts("Vesting");
  const nativeVestingArtifacts =
    locklift.factory.getContractArtifacts("NativeVesting");

  const { contract: vestingFactory } =
    await locklift.deployArtifacts.deployContract(
      "VestingFactory",
      "latest",
      {
        contract: "VestingFactory",
        publicKey: signer?.publicKey as string,
        initParams: {
          deploy_nonce: locklift.utils.getRandomNonce(),
          nativeVestingCode: nativeVestingArtifacts.code,
          vestingCode: vestingArtifacts.code,
        },
        constructorParams: {
          indexCode: indexArtifacts.code,
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

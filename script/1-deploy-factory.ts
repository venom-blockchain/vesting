async function main() {
  console.log(`Deploying Vesting Factory`);
  const signer = (await locklift.keystore.getSigner("0"))!;

  const vestingFactoryContract = locklift.factory.getContractArtifacts("VestingFactory");
  const indexerContract = locklift.factory.getContractArtifacts("Indexer");
  const vestingContract = locklift.factory.getContractArtifacts("Vesting");
  const nativeVestingContract = locklift.factory.getContractArtifacts("NativeVesting");

  const deployNonce = locklift.utils.getRandomNonce();

  const factoryExpectedAddress = await locklift.provider.getExpectedAddress(vestingFactoryContract.abi, {
    tvc: vestingFactoryContract.tvc,
    publicKey: signer?.publicKey as string,
    initParams: {
      deploy_nonce: deployNonce,
      nativeVestingCode: nativeVestingContract.code,
      vestingCode: vestingContract.code,
    },
  });

  const { contract: indexer } = await locklift.factory.deployContract({
    contract: "Indexer",
    publicKey: signer?.publicKey as string,
    initParams: {
      _vestingFactory: factoryExpectedAddress,
    },
    constructorParams: {
      codeIndex: indexerContract.code,
      indexDeployValue: locklift.utils.toNano(0.2),
      indexDestroyValue: locklift.utils.toNano(0.2),
    },
    value: locklift.utils.toNano(5),
  });

  console.log(`Indexer address: ${indexer.address.toString()}`);

  const { contract: vestingFactory } = await locklift.factory.deployContract({
    contract: "VestingFactory",
    publicKey: signer?.publicKey as string,
    initParams: {
      deploy_nonce: deployNonce,
      nativeVestingCode: nativeVestingContract.code,
      vestingCode: vestingContract.code,
    },
    constructorParams: { indexer: indexer.address },
    value: locklift.utils.toNano(5),
  });

  console.log(`VestingFactory contract deployed at: ${vestingFactory.address.toString()}`);
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.log(e);
    process.exit(1);
  });

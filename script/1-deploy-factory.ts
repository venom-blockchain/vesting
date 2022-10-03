async function main() {
  console.log(`Deploying Vesting Factory`);
  const signer = (await locklift.keystore.getSigner("0"))!;
  const vestingContract = locklift.factory.getContractArtifacts("Vesting");
  const nativeVestingContract = locklift.factory.getContractArtifacts(
    "NativeVesting"
  );

  const {
    contract: vestingFactory,
    tx,
  } = await locklift.factory.deployContract({
    contract: "VestingFactory",
    publicKey: signer.publicKey,
    initParams: {
      nativeVestingCode: nativeVestingContract.code,
      vestingCode: vestingContract.code,
      deploy_nonce: locklift.utils.getRandomNonce(),
    },
    constructorParams: {},
    value: locklift.utils.toNano(10),
  });

  console.log(
    `VestingFactory contract deployed at: ${vestingFactory.address.toString()}`
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.log(e);
    process.exit(1);
  });

const {
    convertCrystal
} = locklift.utils;
const logger = require("mocha-logger");


async function main() {
    console.log(`Deploying Vesting Factory`)

    const Vesting = await locklift.factory.getContract('Vesting');
    const NativeVesting = await locklift.factory.getContract('NativeVesting');

    const VestingFactory = await locklift.factory.getContract('VestingFactory');
    const [keyPair] = await locklift.keys.getKeyPairs();
    let factory = await locklift.giver.deployContract({
        contract: VestingFactory,
        constructorParams: {},
        initParams: {
            nativeVestingCode: NativeVesting.code,
            vestingCode: Vesting.code,
            deploy_nonce: locklift.utils.getRandomNonce()
        },
        keyPair,
    }, convertCrystal(5, 'nano'));

    logger.log(`Factory address: ${factory.address}`);

    // Wait until farm token wallet is indexed
    await locklift.ton.client.net.wait_for_collection({
        collection: 'accounts',
        filter: {
            id: { eq: factory.address },
            balance: { gt: `0x0` }
        },
        result: 'id'
    });

    const {
        acc_type_name
    } = await locklift.ton.getAccountType(factory.address);

    console.log(`Factory account state - ${acc_type_name}`)
    console.log(`Factory address: ${factory.address}`);
}

main()
    .then(() => process.exit(0))
    .catch(e => {
        console.log(e);
        process.exit(1);
    });
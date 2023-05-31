const indexAbi = {"ABIversion":2,"version":"2.2","header":["pubkey","time","expire"],"functions":[{"name":"constructor","inputs":[],"outputs":[]},{"name":"getCodeHash","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"uint256"}]},{"name":"getInfo","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"vestingFactory","type":"address"},{"name":"vestingContract","type":"address"},{"name":"acc","type":"address"},{"name":"indexType","type":"uint8"},{"name":"vestingContractType","type":"uint8"}]},{"name":"destruct","inputs":[{"name":"gasReceiver","type":"address"}],"outputs":[]},{"name":"_vestingContractType","inputs":[],"outputs":[{"name":"_vestingContractType","type":"uint8"}]},{"name":"_vestingFactory","inputs":[],"outputs":[{"name":"_vestingFactory","type":"address"}]}],"data":[{"key":1,"name":"_indexer","type":"address"},{"key":2,"name":"_vestingContract","type":"address"},{"key":3,"name":"_acc","type":"address"},{"key":4,"name":"_indexType","type":"uint8"}],"events":[],"fields":[{"name":"_pubkey","type":"uint256"},{"name":"_timestamp","type":"uint64"},{"name":"_constructorFlag","type":"bool"},{"name":"_indexer","type":"address"},{"name":"_vestingContract","type":"address"},{"name":"_acc","type":"address"},{"name":"_indexType","type":"uint8"},{"name":"_vestingContractType","type":"uint8"},{"name":"_vestingFactory","type":"address"}]} as const
const indexerAbi = {"ABIversion":2,"version":"2.2","header":["pubkey","time","expire"],"functions":[{"name":"constructor","inputs":[{"name":"codeIndex","type":"cell"},{"name":"indexDeployValue","type":"uint128"},{"name":"indexDestroyValue","type":"uint128"}],"outputs":[]},{"name":"deployIndex","inputs":[{"name":"vestingContract","type":"address"},{"name":"acc","type":"address"},{"name":"indexType","type":"uint8"},{"name":"vestingContractType","type":"uint8"}],"outputs":[]},{"name":"destructIndex","inputs":[{"name":"index","type":"address"},{"name":"sendGasTo","type":"address"}],"outputs":[]},{"name":"getCodeIndex","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"codeIndex","type":"cell"}]},{"name":"resolveIndexAddress","inputs":[{"name":"answerId","type":"uint32"},{"name":"vestingContract","type":"address"},{"name":"acc","type":"address"},{"name":"indexType","type":"uint8"},{"name":"vestingContractType","type":"uint8"}],"outputs":[{"name":"index","type":"address"}]},{"name":"resolveIndexCodeHash","inputs":[{"name":"answerId","type":"uint32"},{"name":"acc","type":"address"},{"name":"indexType","type":"uint8"},{"name":"vestingContractType","type":"uint8"}],"outputs":[{"name":"codeHash","type":"uint256"}]}],"data":[{"key":1,"name":"_vestingFactory","type":"address"}],"events":[],"fields":[{"name":"_pubkey","type":"uint256"},{"name":"_timestamp","type":"uint64"},{"name":"_constructorFlag","type":"bool"},{"name":"_vestingFactory","type":"address"},{"name":"_codeIndex","type":"cell"},{"name":"_indexDeployValue","type":"uint128"},{"name":"_indexDestroyValue","type":"uint128"},{"name":"_owner","type":"address"}]} as const
const nativeVestingAbi = {"ABIversion":2,"version":"2.2","header":["time","expire"],"functions":[{"name":"constructor","inputs":[{"name":"_user","type":"address"},{"name":"_creator","type":"address"},{"name":"_vestingAmount","type":"uint128"},{"name":"_vestingStart","type":"uint32"},{"name":"_vestingEnd","type":"uint32"}],"outputs":[]},{"name":"getDetails","inputs":[],"outputs":[{"name":"_user","type":"address"},{"name":"_creator","type":"address"},{"name":"_vestingAmount","type":"uint128"},{"name":"_vestingStart","type":"uint32"},{"name":"_vestingEnd","type":"uint32"},{"name":"_lastClaimTime","type":"uint32"},{"name":"_balance","type":"uint128"},{"name":"_filled","type":"bool"},{"name":"_vested","type":"bool"},{"name":"_nonce","type":"uint128"},{"name":"_factory","type":"address"}]},{"name":"deposit","inputs":[{"name":"send_gas_to","type":"address"}],"outputs":[]},{"name":"pendingVested","inputs":[],"outputs":[{"name":"value_to_claim","type":"uint128"}]},{"name":"claim","inputs":[],"outputs":[]}],"data":[{"key":1,"name":"nonce","type":"uint128"},{"key":2,"name":"factory","type":"address"}],"events":[{"name":"Deposit","inputs":[{"name":"sender","type":"address"},{"name":"amount","type":"uint128"}],"outputs":[]},{"name":"Claim","inputs":[{"name":"amount","type":"uint128"},{"name":"remaining_amount","type":"uint128"}],"outputs":[]},{"name":"Vested","inputs":[],"outputs":[]}],"fields":[{"name":"_pubkey","type":"uint256"},{"name":"_timestamp","type":"uint64"},{"name":"_constructorFlag","type":"bool"},{"name":"nonce","type":"uint128"},{"name":"factory","type":"address"},{"name":"user","type":"address"},{"name":"creator","type":"address"},{"name":"vestingAmount","type":"uint128"},{"name":"vestingStart","type":"uint32"},{"name":"vestingEnd","type":"uint32"},{"name":"lastClaimTime","type":"uint32"},{"name":"balance","type":"uint128"},{"name":"filled","type":"bool"},{"name":"vested","type":"bool"}]} as const
const tokenRootUpgradeableAbi = {"ABIversion":2,"version":"2.2","header":["pubkey","time","expire"],"functions":[{"name":"constructor","inputs":[{"name":"initialSupplyTo","type":"address"},{"name":"initialSupply","type":"uint128"},{"name":"deployWalletValue","type":"uint128"},{"name":"mintDisabled","type":"bool"},{"name":"burnByRootDisabled","type":"bool"},{"name":"burnPaused","type":"bool"},{"name":"remainingGasTo","type":"address"}],"outputs":[]},{"name":"supportsInterface","inputs":[{"name":"answerId","type":"uint32"},{"name":"interfaceID","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"walletVersion","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"uint32"}]},{"name":"platformCode","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"cell"}]},{"name":"requestUpgradeWallet","inputs":[{"name":"currentVersion","type":"uint32"},{"name":"walletOwner","type":"address"},{"name":"remainingGasTo","type":"address"}],"outputs":[]},{"name":"setWalletCode","inputs":[{"name":"code","type":"cell"}],"outputs":[]},{"name":"upgrade","inputs":[{"name":"code","type":"cell"}],"outputs":[]},{"name":"disableMint","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"mintDisabled","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"burnTokens","inputs":[{"name":"amount","type":"uint128"},{"name":"walletOwner","type":"address"},{"name":"remainingGasTo","type":"address"},{"name":"callbackTo","type":"address"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"disableBurnByRoot","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"burnByRootDisabled","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"burnPaused","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"setBurnPaused","inputs":[{"name":"answerId","type":"uint32"},{"name":"paused","type":"bool"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"transferOwnership","inputs":[{"name":"newOwner","type":"address"},{"name":"remainingGasTo","type":"address"},{"components":[{"name":"value","type":"uint128"},{"name":"payload","type":"cell"}],"name":"callbacks","type":"map(address,tuple)"}],"outputs":[]},{"name":"name","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"string"}]},{"name":"symbol","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"string"}]},{"name":"decimals","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"uint8"}]},{"name":"totalSupply","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"uint128"}]},{"name":"walletCode","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"cell"}]},{"name":"rootOwner","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"address"}]},{"name":"walletOf","inputs":[{"name":"answerId","type":"uint32"},{"name":"walletOwner","type":"address"}],"outputs":[{"name":"value0","type":"address"}]},{"name":"deployWallet","inputs":[{"name":"answerId","type":"uint32"},{"name":"walletOwner","type":"address"},{"name":"deployWalletValue","type":"uint128"}],"outputs":[{"name":"tokenWallet","type":"address"}]},{"name":"mint","inputs":[{"name":"amount","type":"uint128"},{"name":"recipient","type":"address"},{"name":"deployWalletValue","type":"uint128"},{"name":"remainingGasTo","type":"address"},{"name":"notify","type":"bool"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"acceptBurn","id":"0x192B51B1","inputs":[{"name":"amount","type":"uint128"},{"name":"walletOwner","type":"address"},{"name":"remainingGasTo","type":"address"},{"name":"callbackTo","type":"address"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"sendSurplusGas","inputs":[{"name":"to","type":"address"}],"outputs":[]}],"data":[{"key":1,"name":"name_","type":"string"},{"key":2,"name":"symbol_","type":"string"},{"key":3,"name":"decimals_","type":"uint8"},{"key":4,"name":"rootOwner_","type":"address"},{"key":5,"name":"walletCode_","type":"cell"},{"key":6,"name":"randomNonce_","type":"uint256"},{"key":7,"name":"deployer_","type":"address"},{"key":8,"name":"platformCode_","type":"cell"}],"events":[],"fields":[{"name":"_pubkey","type":"uint256"},{"name":"_timestamp","type":"uint64"},{"name":"_constructorFlag","type":"bool"},{"name":"name_","type":"string"},{"name":"symbol_","type":"string"},{"name":"decimals_","type":"uint8"},{"name":"rootOwner_","type":"address"},{"name":"walletCode_","type":"cell"},{"name":"totalSupply_","type":"uint128"},{"name":"burnPaused_","type":"bool"},{"name":"burnByRootDisabled_","type":"bool"},{"name":"mintDisabled_","type":"bool"},{"name":"randomNonce_","type":"uint256"},{"name":"deployer_","type":"address"},{"name":"platformCode_","type":"cell"},{"name":"walletVersion_","type":"uint32"}]} as const
const tokenWalletPlatformAbi = {"ABIversion":2,"version":"2.2","header":["time"],"functions":[{"name":"constructor","id":"0x15A038FB","inputs":[{"name":"walletCode","type":"cell"},{"name":"walletVersion","type":"uint32"},{"name":"sender","type":"address"},{"name":"remainingGasTo","type":"address"}],"outputs":[]}],"data":[{"key":1,"name":"root","type":"address"},{"key":2,"name":"owner","type":"address"}],"events":[],"fields":[{"name":"_pubkey","type":"uint256"},{"name":"_timestamp","type":"uint64"},{"name":"_constructorFlag","type":"bool"},{"name":"root","type":"address"},{"name":"owner","type":"address"}]} as const
const tokenWalletUpgradeableAbi = {"ABIversion":2,"version":"2.2","header":["pubkey","time","expire"],"functions":[{"name":"constructor","inputs":[],"outputs":[]},{"name":"supportsInterface","inputs":[{"name":"answerId","type":"uint32"},{"name":"interfaceID","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"platformCode","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"cell"}]},{"name":"onDeployRetry","id":"0x15A038FB","inputs":[{"name":"value0","type":"cell"},{"name":"value1","type":"uint32"},{"name":"sender","type":"address"},{"name":"remainingGasTo","type":"address"}],"outputs":[]},{"name":"version","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"uint32"}]},{"name":"upgrade","inputs":[{"name":"remainingGasTo","type":"address"}],"outputs":[]},{"name":"acceptUpgrade","inputs":[{"name":"newCode","type":"cell"},{"name":"newVersion","type":"uint32"},{"name":"remainingGasTo","type":"address"}],"outputs":[]},{"name":"burnByRoot","inputs":[{"name":"amount","type":"uint128"},{"name":"remainingGasTo","type":"address"},{"name":"callbackTo","type":"address"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"destroy","inputs":[{"name":"remainingGasTo","type":"address"}],"outputs":[]},{"name":"burn","inputs":[{"name":"amount","type":"uint128"},{"name":"remainingGasTo","type":"address"},{"name":"callbackTo","type":"address"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"balance","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"uint128"}]},{"name":"owner","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"address"}]},{"name":"root","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"address"}]},{"name":"walletCode","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"cell"}]},{"name":"transfer","inputs":[{"name":"amount","type":"uint128"},{"name":"recipient","type":"address"},{"name":"deployWalletValue","type":"uint128"},{"name":"remainingGasTo","type":"address"},{"name":"notify","type":"bool"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"transferToWallet","inputs":[{"name":"amount","type":"uint128"},{"name":"recipientTokenWallet","type":"address"},{"name":"remainingGasTo","type":"address"},{"name":"notify","type":"bool"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"acceptTransfer","id":"0x67A0B95F","inputs":[{"name":"amount","type":"uint128"},{"name":"sender","type":"address"},{"name":"remainingGasTo","type":"address"},{"name":"notify","type":"bool"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"acceptMint","id":"0x4384F298","inputs":[{"name":"amount","type":"uint128"},{"name":"remainingGasTo","type":"address"},{"name":"notify","type":"bool"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"sendSurplusGas","inputs":[{"name":"to","type":"address"}],"outputs":[]}],"data":[{"key":1,"name":"root_","type":"address"},{"key":2,"name":"owner_","type":"address"}],"events":[],"fields":[{"name":"_pubkey","type":"uint256"},{"name":"_timestamp","type":"uint64"},{"name":"_constructorFlag","type":"bool"},{"name":"root_","type":"address"},{"name":"owner_","type":"address"},{"name":"balance_","type":"uint128"},{"name":"version_","type":"uint32"},{"name":"platformCode_","type":"cell"}]} as const
const vestingAbi = {"ABIversion":2,"version":"2.2","header":["time","expire"],"functions":[{"name":"constructor","inputs":[{"name":"_user","type":"address"},{"name":"_creator","type":"address"},{"name":"_token","type":"address"},{"name":"_vestingAmount","type":"uint128"},{"name":"_vestingStart","type":"uint32"},{"name":"_vestingEnd","type":"uint32"}],"outputs":[]},{"name":"receiveTokenWalletAddress","inputs":[{"name":"wallet","type":"address"}],"outputs":[]},{"name":"dummy","inputs":[{"name":"value0","type":"address"}],"outputs":[]},{"name":"getDetails","inputs":[],"outputs":[{"name":"_user","type":"address"},{"name":"_creator","type":"address"},{"name":"_token","type":"address"},{"name":"_vestingAmount","type":"uint128"},{"name":"_vestingStart","type":"uint32"},{"name":"_vestingEnd","type":"uint32"},{"name":"_lastClaimTime","type":"uint32"},{"name":"_tokenBalance","type":"uint128"},{"name":"_tokenWallet","type":"address"},{"name":"_filled","type":"bool"},{"name":"_vested","type":"bool"},{"name":"_nonce","type":"uint128"},{"name":"_factory","type":"address"}]},{"name":"onAcceptTokensTransfer","inputs":[{"name":"value0","type":"address"},{"name":"amount","type":"uint128"},{"name":"sender","type":"address"},{"name":"value3","type":"address"},{"name":"remainingGasTo","type":"address"},{"name":"value5","type":"cell"}],"outputs":[]},{"name":"pendingVested","inputs":[],"outputs":[{"name":"tokens_to_claim","type":"uint128"}]},{"name":"claim","inputs":[],"outputs":[]}],"data":[{"key":1,"name":"nonce","type":"uint128"},{"key":2,"name":"factory","type":"address"}],"events":[{"name":"ReceivedTokenWalletAddress","inputs":[{"name":"wallet","type":"address"}],"outputs":[]},{"name":"Deposit","inputs":[{"name":"sender","type":"address"},{"name":"amount","type":"uint128"}],"outputs":[]},{"name":"BadDeposit","inputs":[{"name":"sender","type":"address"},{"name":"amount","type":"uint128"}],"outputs":[]},{"name":"Claim","inputs":[{"name":"amount","type":"uint128"},{"name":"remaining_amount","type":"uint128"}],"outputs":[]},{"name":"Vested","inputs":[],"outputs":[]}],"fields":[{"name":"_pubkey","type":"uint256"},{"name":"_timestamp","type":"uint64"},{"name":"_constructorFlag","type":"bool"},{"name":"nonce","type":"uint128"},{"name":"factory","type":"address"},{"name":"user","type":"address"},{"name":"creator","type":"address"},{"name":"token","type":"address"},{"name":"vestingAmount","type":"uint128"},{"name":"vestingStart","type":"uint32"},{"name":"vestingEnd","type":"uint32"},{"name":"lastClaimTime","type":"uint32"},{"name":"tokenBalance","type":"uint128"},{"name":"tokenWallet","type":"address"},{"name":"filled","type":"bool"},{"name":"vested","type":"bool"}]} as const
const vestingFactoryAbi = {"ABIversion":2,"version":"2.2","header":["pubkey","time","expire"],"functions":[{"name":"constructor","inputs":[{"name":"indexer","type":"address"}],"outputs":[]},{"name":"deployNativeVesting","inputs":[{"name":"user","type":"address"},{"name":"vesting_amount","type":"uint128"},{"name":"vesting_start","type":"uint32"},{"name":"vesting_end","type":"uint32"}],"outputs":[]},{"name":"deployVesting","inputs":[{"name":"user","type":"address"},{"name":"token","type":"address"},{"name":"vesting_amount","type":"uint128"},{"name":"vesting_start","type":"uint32"},{"name":"vesting_end","type":"uint32"}],"outputs":[]},{"name":"onVestingDeployed","inputs":[{"name":"nonce","type":"uint128"},{"name":"user","type":"address"},{"name":"creator","type":"address"},{"name":"token","type":"address"},{"name":"vesting_amount","type":"uint128"},{"name":"vesting_start","type":"uint32"},{"name":"vesting_end","type":"uint32"}],"outputs":[]},{"name":"deploy_nonce","inputs":[],"outputs":[{"name":"deploy_nonce","type":"uint128"}]},{"name":"vestings_deployed","inputs":[],"outputs":[{"name":"vestings_deployed","type":"uint128"}]},{"name":"_indexer","inputs":[],"outputs":[{"name":"_indexer","type":"address"}]}],"data":[{"key":1,"name":"deploy_nonce","type":"uint128"},{"key":2,"name":"vestingCode","type":"cell"},{"key":3,"name":"nativeVestingCode","type":"cell"}],"events":[{"name":"NewVesting","inputs":[{"name":"vesting","type":"address"},{"name":"user","type":"address"},{"name":"creator","type":"address"},{"name":"token","type":"address"},{"name":"amount","type":"uint128"},{"name":"start","type":"uint32"},{"name":"end","type":"uint32"}],"outputs":[]}],"fields":[{"name":"_pubkey","type":"uint256"},{"name":"_timestamp","type":"uint64"},{"name":"_constructorFlag","type":"bool"},{"name":"deploy_nonce","type":"uint128"},{"name":"vestingCode","type":"cell"},{"name":"nativeVestingCode","type":"cell"},{"name":"vestings_deployed","type":"uint128"},{"name":"_indexer","type":"address"}]} as const
const walletAbi = {"ABIversion":2,"version":"2.2","header":["pubkey","time","expire"],"functions":[{"name":"sendTransaction","inputs":[{"name":"dest","type":"address"},{"name":"value","type":"uint128"},{"name":"bounce","type":"bool"},{"name":"flags","type":"uint8"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"transferOwnership","inputs":[{"name":"newOwner","type":"uint256"}],"outputs":[]},{"name":"constructor","inputs":[],"outputs":[]},{"name":"owner","inputs":[],"outputs":[{"name":"owner","type":"uint256"}]},{"name":"_randomNonce","inputs":[],"outputs":[{"name":"_randomNonce","type":"uint256"}]}],"data":[{"key":1,"name":"_randomNonce","type":"uint256"}],"events":[{"name":"OwnershipTransferred","inputs":[{"name":"previousOwner","type":"uint256"},{"name":"newOwner","type":"uint256"}],"outputs":[]}],"fields":[{"name":"_pubkey","type":"uint256"},{"name":"_timestamp","type":"uint64"},{"name":"_constructorFlag","type":"bool"},{"name":"owner","type":"uint256"},{"name":"_randomNonce","type":"uint256"}]} as const

export const factorySource = {
    Index: indexAbi,
    Indexer: indexerAbi,
    NativeVesting: nativeVestingAbi,
    TokenRootUpgradeable: tokenRootUpgradeableAbi,
    TokenWalletPlatform: tokenWalletPlatformAbi,
    TokenWalletUpgradeable: tokenWalletUpgradeableAbi,
    Vesting: vestingAbi,
    VestingFactory: vestingFactoryAbi,
    Wallet: walletAbi
} as const

export type FactorySource = typeof factorySource
export type IndexAbi = typeof indexAbi
export type IndexerAbi = typeof indexerAbi
export type NativeVestingAbi = typeof nativeVestingAbi
export type TokenRootUpgradeableAbi = typeof tokenRootUpgradeableAbi
export type TokenWalletPlatformAbi = typeof tokenWalletPlatformAbi
export type TokenWalletUpgradeableAbi = typeof tokenWalletUpgradeableAbi
export type VestingAbi = typeof vestingAbi
export type VestingFactoryAbi = typeof vestingFactoryAbi
export type WalletAbi = typeof walletAbi

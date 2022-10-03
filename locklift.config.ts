import { LockliftConfig } from "locklift";

import { FactorySource } from "./build/factorySource";
import { SimpleGiver, GiverWalletV3 } from "./giverSettings";

declare global {
  const locklift: import("locklift").Locklift<FactorySource>;
}

const LOCAL_NETWORK_ENDPOINT = "http://localhost/graphql";

const config: LockliftConfig = {
  compiler: {
    // Specify path to your TON-Solidity-Compiler
    // path: "/mnt/o/projects/broxus/TON-Solidity-Compiler/build/solc/solc",

    // Or specify version of compiler
    version: "0.57.1",

    // Specify config for extarnal contracts as in exapmple
    // externalContracts: {
    //   "node_modules/broxus-ton-tokens-contracts/build": ['TokenRoot', 'TokenWallet']
    // }
  },
  linker: {
    // Specify path to your stdlib
    // lib: "/mnt/o/projects/broxus/TON-Solidity-Compiler/lib/stdlib_sol.tvm",
    // // Specify path to your Linker
    // path: "/mnt/o/projects/broxus/TVM-linker/target/release/tvm_linker",

    // Or specify version of linker
    version: "0.15.35",
  },
  networks: {
    local: {
      // Specify connection settings for https://github.com/broxus/everscale-standalone-client/
      connection: {
        group: "localnet",
        type: "graphql",
        data: {
          endpoints: [LOCAL_NETWORK_ENDPOINT],
          latencyDetectionInterval: 1000,
          local: true,
        },
      },
      // This giver is default local-node giverV2
      giver: {
        // Check if you need provide custom giver
        giverFactory: (ever, keyPair, address) =>
          new SimpleGiver(ever, keyPair, address),
        address:
          "0:ece57bcc6c530283becbbd8a3b24d3c5987cdddc3c8b7b33be6e4a6312490415",
        key: "172af540e43a524763dd53b26a066d472a97c4de37d5498170564510608250c3",
      },
      tracing: {
        endpoint: LOCAL_NETWORK_ENDPOINT,
      },
      keys: {
        // Use everdev to generate your phrase
        // !!! Never commit it in your repos !!!
        // phrase: "action inject penalty envelope rabbit element slim tornado dinner pizza off blood",
        amount: 20,
      },
    },
    testnet: {
      connection: {
        group: "testnet",
        type: "jrpc",
        data: {
          endpoint: "https://jrpc-testnet.venom.foundation/rpc",
        },
      },
      giver: {
        giverFactory: (ever, keyPair, address) =>
          new GiverWalletV3(ever, keyPair, address),
        address: "", // TODO: set walletV3 address
        key: "", // TODO: set walletV3 private key
      },
      keys: {
        // !!! Never commit it in your repos !!!
        phrase: "", //TODO: set walletV3 seed phrase
        amount: 20,
      },
    },
    mainnet: {
      connection: {
        group: "mainnet",
        type: "jrpc",
        data: {
          endpoint: "https://jrpc.venom.foundation/rpc",
        },
      },
      giver: {
        giverFactory: (ever, keyPair, address) =>
          new GiverWalletV3(ever, keyPair, address),
        address: "", // TODO: set walletV3 address
        key: "", // TODO: set walletV3 private key
      },
      keys: {
        // !!! Never commit it in your repos !!!
        phrase: "", //TODO: set walletV3 seed phrase
        amount: 20,
      },
    },
  },
  mocha: {
    timeout: 2000000,
  },
};

export default config;

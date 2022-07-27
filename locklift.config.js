module.exports = {
  compiler: {
    // Specify path to your TON-Solidity-Compiler
    path: `$HOME/.everdev/solidity/solc`
  },
  linker: {
    // Path to your TVM Linker
    path: `$HOME/.everdev/solidity/tvm_linker`,
  },
  networks: {
    local: {
      ton_client: {
        // See the TON client specification for all available options
        network: {
          server_address: 'https://gql.venom.foundation',
        },
      },
      // This giver is default local-node giver
      giver: {
        address: '',
        abi: { "ABI version": 1, "functions": [ { "name": "constructor", "inputs": [], "outputs": [] }, { "name": "sendGrams", "inputs": [ {"name":"dest","type":"address"}, {"name":"amount","type":"uint64"} ], "outputs": [] } ], "events": [], "data": [] },
        key: '',
      },
      // Use tonos-cli to generate your phrase
      // !!! Never commit it in your repos !!!
      keys: {
        phrase: '',
        amount: 20,
      }
    },
    local: {
      ton_client: {
        // See the TON client specification for all available options
        network: {
          server_address: 'http://localhost/',
        },
      },
      // This giver is default local-node giver
      giver: {
        address: '0:841288ed3b55d9cdafa806807f02a0ae0c169aa5edfe88a789a6482429756a94',
        abi: { "ABI version": 1, "functions": [ { "name": "constructor", "inputs": [], "outputs": [] }, { "name": "sendGrams", "inputs": [ {"name":"dest","type":"address"}, {"name":"amount","type":"uint64"} ], "outputs": [] } ], "events": [], "data": [] },
        key: '',
      },
      // Use tonos-cli to generate your phrase
      // !!! Never commit it in your repos !!!
      keys: {
        phrase: '',
        amount: 20,
      }
    },
  },
};

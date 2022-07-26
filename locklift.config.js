module.exports = {
  compiler: {
    path: '/usr/bin/solc_0571',
  },
  linker: {
    path: '/usr/bin/tvm_linker-80e31a5',
  },
  networks: {
    local: {
      ton_client: {
        network: {
          server_address: 'http://localhost/',
        },
      },
      giver: {
        address: '0:841288ed3b55d9cdafa806807f02a0ae0c169aa5edfe88a789a6482429756a94',
        abi: { "ABI version": 1, "functions": [ { "name": "constructor", "inputs": [], "outputs": [] }, { "name": "sendGrams", "inputs": [ {"name":"dest","type":"address"}, {"name":"amount","type":"uint64"} ], "outputs": [] } ], "events": [], "data": [] },
        key: '',
      },
      keys: {
        phrase: '',
        amount: 20,
      }
    },
    dev: {
      ton_client: {
        network: {
          server_address: 'https://net.ton.dev/',
        },
      },
      giver: {
        address: '0:a4053fd2e9798d0457c9e8f012cef203e49da863d76f36d52d5e2e62c326b217',
        abi: {
          "ABI version": 2,
          "header": ["pubkey", "time", "expire"],
          "functions": [{"name": "constructor", "inputs": [], "outputs": []}, {
            "name": "sendGrams",
            "inputs": [{"name": "dest", "type": "address"}, {"name": "amount", "type": "uint64"}],
            "outputs": []
          }, {"name": "owner", "inputs": [], "outputs": [{"name": "owner", "type": "uint256"}]}],
          "data": [{"key": 1, "name": "owner", "type": "uint256"}],
          "events": []
        },
        key: "",
      },
      keys: {
        phrase: '',
        amount: 5,
      }
    },
    fld: {
      ton_client: {
        network: {
          server_address: 'https://gql.custler.net/'
        }
      },
      giver: {
        address: '0:28cbba1c9052a6552e600e53d57d17fa3a1f1a9a05ce1d1f5c8a825d5811811e',
        abi: { "ABI version": 2, "header": ["pubkey", "time", "expire"], "functions": [ { "name": "constructor", "inputs": [ ], "outputs": [ ] }, { "name": "sendGrams", "inputs": [ {"name":"dest","type":"address"}, {"name":"amount","type":"uint64"} ], "outputs": [ ] }, { "name": "owner", "inputs": [ ], "outputs": [ {"name":"owner","type":"uint256"} ] } ], "data": [ {"key":1,"name":"owner","type":"uint256"} ], "events": [ ] },
        key: "",
      },
      keys: {
        phrase: '',
        amount: 20,
      }
    },
    main: {
      ton_client: {
        network: {
          server_address: 'https://main.ton.dev'
        }
      },
      giver: {
        address: '0:3bcef54ea5fe3e68ac31b17799cdea8b7cffd4da75b0b1a70b93a18b5c87f723',
        abi: { "ABI version": 2, "header": ["pubkey", "time", "expire"], "functions": [ { "name": "constructor", "inputs": [ ], "outputs": [ ] }, { "name": "sendGrams", "inputs": [ {"name":"dest","type":"address"}, {"name":"amount","type":"uint64"} ], "outputs": [ ] }, { "name": "owner", "inputs": [ ], "outputs": [ {"name":"owner","type":"uint256"} ] } ], "data": [ {"key":1,"name":"owner","type":"uint256"} ], "events": [ ] },
        key: "",
      },
      keys: {
        phrase: '',
        amount: 20,
      }
    },
  },
};

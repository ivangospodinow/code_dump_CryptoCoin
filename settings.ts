const nodes = [
    {
        port: 4421
    },
    {
        port: 4422,
    },
    {
        port: 4423,
    }
];
let node = 0;
process.argv.forEach((str) => {
    if (str.substr(0, 6) === '--node') {
        node = parseInt(str.split('--node=')[1]);
    }
});

console.log('Node ' + (node + 1));


export default {
    nodes: nodes,
    NODE: node,
    SERVER_PORT: nodes[node].port,
    BLOCK_REWARD: 1.00000000,
    COIN_DECIMALS: 8,
    TARGET_BLOKC_TIME_SEC: 5,
    TARGET_BLOKC_TIME_REAJUST: 5,
    BCRYPT_SALT_SIZE: 1,
    // DB_KEY_SIZE : 128,
    LAST_BLOCK_HEIGHT_KEY: 'last_block_height',
    LAST_BLOCK_NAME_KEY: 'last_block_name',
    PEERS_KEY: 'peers',
    // refferes to count of numbers to fetch
    QUEUE_ITEMS_TO_PROCESS_LIMIT: 10,
    MINING_ENABLED_KEY: 'mining_enabled',
    MAX_PROPAGET_PEERS_COUNT: 10,
    MAX_TARGET: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
    FIRST_TARGET: '0x1a36e2eb1c432d000000000000000000000000000000000000000000000000',
    mysql: {
        host: "localhost",
        user: "root",
        password: "",
        database: "coint3_node" + (node + 1),
    },
    addresses: [
        {
            public: '0452b239584f1f9365e6840209423812c6ff58e2df636f76d48ba95b50d4133ed6bd9cdc80815ac286e8c5286607c1a4e68111362b9e432e8311bd3b57264131ed',
            private: '22e755dace06b5acffea126bfe4f989864ebca1ecb93aa7f00c78fe2e01a19ae',
        },
        {
            public: '048ba6436141199766c0f9028b7742cda67fef1e4f04a54b04b08c0bd910b52d04033138520555968e4ce96253ca13b2636bb892e4389fbde1099f4c74e9e72a95',
            private: '48d4f06d771239643b6eaab915da0d441733932763e51402164668d4bbccc95d',
        },
        {
            public: '048ba6436141199766c0f9028b7742cda67fef1e4f04a54b04b08c0bd910b52d04033138520555968e4ce96253ca13b2636bb892e4389fbde1099f4c74e9e72a95',
            private: '48d4f06d771239643b6eaab915da0d441733932763e51402164668d4bbccc95d',
        },
    ],
};

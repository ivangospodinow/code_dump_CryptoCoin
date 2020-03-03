import Storage from './core/Storage/Storage';
import MysqlStorage from './core/Storage/MysqlStorage';
import settings from './settings';
import BlockModel from './core/Block/BlockModel';
import Address from './core/Address/Address';
import BlockRepo from './core/Repo/BlockRepo';
import SettingsRepo from './core/Repo/SettingsRepo';
import MiningService from './core/Service/MiningService';
import Block from './core/Block/Block';
import BlockValidator from './core/Validator/BlockValidator';
import TransactionRepo from './core/Repo/TransactionRepo';
import AddressService from './core/Service/AddressService';
import UtxoRepo from './core/Repo/UtxoRepo';
import PoolRepo from './core/Repo/PoolRepo';

const mysqlstorage = new MysqlStorage(settings.mysql);
const storage = new Storage(mysqlstorage);

const address = new Address(settings['addresses'][0]['public'], settings['addresses'][0]['private']);
const address2 = new Address(settings['addresses'][1]['public'], settings['addresses'][1]['private']);

const transactionRepo = new TransactionRepo(storage);

const blockModel = new BlockModel(storage);
const blockRepo = new BlockRepo(storage, transactionRepo);

const settingsRepo = new SettingsRepo(storage);
const utxoRepo = new UtxoRepo(storage, transactionRepo);
const poolRepo = new PoolRepo(storage, transactionRepo, utxoRepo);
const mining = new MiningService(settingsRepo, blockModel, blockRepo, poolRepo);

const namespaces = [
    'block',
    'pool',
    'setting',
    'transaction',
    'utxo',
];

(async function() {
    const sql = namespaces.map((name) => {
        return "TRUNCATE `" + name + "`";
    }).join(";\n");
    mysqlstorage.connection.query(sql, [], function queryCallback(error: any, result: any) {

        settingsRepo.setSetting(settings.PEERS_KEY, {
            peers : [{ip : '192.168.0.3', port: 4421}]
        });

        mining.createNextBlock(address).then((block) => {
            mining.mine(block).then((result : {difficulty : number, nonce : string}) => {
                block.difficulty = result['difficulty'];
                block.nonce = result['nonce'];
                blockRepo.persist(block).then(() => {
                    console.log('Chain reset done')
                    process.exit();
                });
            });
        });
    });
})();

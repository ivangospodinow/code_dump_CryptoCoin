import Storage from './core/Storage/Storage';
import MysqlStorage from './core/Storage/MysqlStorage';
import settings from './settings';
import { rand, sha256x2 } from './core/tools';
import BlockModel from './core/Block/BlockModel';
import Address from './core/Address/Address';
import BlockRepo from './core/Repo/BlockRepo';
import SettingsRepo from './core/Repo/SettingsRepo';
import MiningService, { MineResult } from './core/Service/MiningService';
import Block from './core/Block/Block';
import BlockValidator from './core/Validator/BlockValidator';
import TransactionRepo from './core/Repo/TransactionRepo';
import AddressService from './core/Service/AddressService';
import UtxoRepo from './core/Repo/UtxoRepo';
import PoolRepo from './core/Repo/PoolRepo';
const cryptoRandomString = require('crypto-random-string');

const storage = new Storage(new MysqlStorage(settings.mysql));

const address = new Address(settings['addresses'][0]['public'], settings['addresses'][0]['private']);
const address2 = new Address(settings['addresses'][1]['public'], settings['addresses'][1]['private']);

const transactionRepo = new TransactionRepo(storage);

const blockModel = new BlockModel(storage);
const blockRepo = new BlockRepo(storage, transactionRepo);

const settingsRepo = new SettingsRepo(storage);
const utxoRepo = new UtxoRepo(storage, transactionRepo);
const poolRepo = new PoolRepo(storage, transactionRepo, utxoRepo);
const mining = new MiningService(settingsRepo, blockModel, blockRepo, poolRepo);
const validator = new BlockValidator(blockModel, blockRepo);

const addressService = new AddressService(settingsRepo, blockRepo);

(function miner() {
    const minerLoop = async function () {
        mining.createNextBlock(address).then((block: Block) => {
            mining.mine(block).then((result : MineResult) => {
                block.difficulty = result['difficulty'];
                block.nonce = result['nonce'];
                blockRepo.persist(block).then(() => {
                    console.log("\n" + 'Mined ' + block.height + ' diff ' + block.difficulty + "\n" );
                    minerLoop();
                });
            });
        });
    };
    minerLoop();
})();

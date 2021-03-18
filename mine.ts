import Storage from './core/Storage/Storage';
import MysqlStorage from './core/Storage/MysqlStorage';
import settings from './settings';
import { getTimestampString, rand, sha256x2 } from './core/tools';
import BlockModel from './core/Block/BlockModel';
import Address from './core/Address/Address';
import BlockRepo, { AddBlockOptions } from './core/Repo/BlockRepo';
import SettingsRepo from './core/Repo/SettingsRepo';
import MiningService, { MineResult } from './core/Service/MiningService';
import Block from './core/Block/Block';
import BlockValidator from './core/Validator/BlockValidator';
import TransactionRepo from './core/Repo/TransactionRepo';
import AddressService from './core/Service/AddressService';
import UtxoRepo from './core/Repo/UtxoRepo';
import PoolRepo from './core/Repo/PoolRepo';
import { queueRepo, BLOCK_FACTORY, blockRepo, eventsManager } from './globals';
import Queue, { QUEUE_TYPE_BLOCK } from './core/Block/Queue';
const cryptoRandomString = require('crypto-random-string');

const storage = new Storage(new MysqlStorage(settings.mysql));

const address = new Address(settings['addresses'][0]['public'], settings['addresses'][0]['private']);
const address2 = new Address(settings['addresses'][1]['public'], settings['addresses'][1]['private']);

const transactionRepo = new TransactionRepo(storage);

const blockModel = new BlockModel(storage);
const settingsRepo = new SettingsRepo(storage);
const utxoRepo = new UtxoRepo(storage, transactionRepo);
const poolRepo = new PoolRepo(storage, transactionRepo, utxoRepo);
const mining = new MiningService(settingsRepo, blockModel, blockRepo, poolRepo, eventsManager);
const validator = new BlockValidator(blockModel);

const addressService = new AddressService(settingsRepo, blockRepo);

(function miner() {
    let block;
    let resultResult;
    let queueId: string;
    let waitForQueueToProcess: CallableFunction;
    let chainHeight: number;
    let blockOptions: AddBlockOptions = {
        chainHeight: 0,
        blockNamesForHeight: [],
    };

    const minerLoop = async function () {
        block = await mining.createNextBlock(address);
        console.log('new block height ' + block.height);
        resultResult = await mining.mine(block);
        block.timestamp = getTimestampString();
        block.target = resultResult['target'];
        block.nonce = resultResult['nonce'];

        blockOptions.chainHeight = await settingsRepo.getLastBlockHeight();
        blockOptions.blockNamesForHeight = [];

        console.log('Mined ' + block.height + ' diff ' + block.target);

        await blockRepo.addBlock(block, blockOptions);

        minerLoop();
        // queueId = await queueRepo.persist(new Queue({
        //     type: QUEUE_TYPE_BLOCK,
        //     data: BLOCK_FACTORY.createArrayFromObject(block)
        // }));

        // console.log('Queue added');

        // waitForQueueToProcess = function () {
        //     console.log("Check queue");
        //     queueRepo.exists(queueId).then(function queueExists(exists: boolean) {
        //         if (exists) {
        //             setTimeout(waitForQueueToProcess, 100);
        //         } else {
        //             minerLoop();
        //         }
        //     });
        // };
        // setTimeout(waitForQueueToProcess, 100);

        /**
         *             queueRepo.persist(new Queue({
                        type: QUEUE_TYPE_BLOCK,
                        data: BLOCK_FACTORY.createArrayFromObject(block)
                    })).then(() => {
                        console.log("\n" + 'Mined ' + block.height + ' diff ' + block.difficulty + "\n");
                        minerLoop();
                    });
         */

    };
    minerLoop();
})();

setInterval(() => {
    console.log((process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + 'mb');
}, 5000);
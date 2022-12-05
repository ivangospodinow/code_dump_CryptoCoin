import Storage from './core/Storage/Storage';
import MysqlStorage from './core/Storage/MysqlStorage';
import settings from './settings';
import { hexToNumber, numberToHex, rand, reverseHex, sha256x2 } from './core/tools';
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
import { queueRepo, BLOCK_FACTORY, blockRepo, eventsManager, chainRepo } from './globals';
import Queue, { QUEUE_TYPE_BLOCK } from './core/Block/Queue';
const cryptoRandomString = require('crypto-random-string');

const storage = new Storage(new MysqlStorage(settings.mysql));

const address1 = new Address(settings['addresses'][0]['public'], settings['addresses'][0]['private']);
const address2 = new Address(settings['addresses'][1]['public'], settings['addresses'][1]['private']);

const transactionRepo = new TransactionRepo(storage);

const blockModel = new BlockModel(storage);
const settingsRepo = new SettingsRepo(storage);
const utxoRepo = new UtxoRepo(storage, transactionRepo);
const poolRepo = new PoolRepo(storage, transactionRepo, utxoRepo);
const mining1 = new MiningService(settingsRepo, blockModel, blockRepo, poolRepo, eventsManager, chainRepo);
const mining2 = new MiningService(settingsRepo, blockModel, blockRepo, poolRepo, eventsManager, chainRepo);

const validator = new BlockValidator(blockModel);

const addressService = new AddressService(settingsRepo, blockRepo);

const QUEUE_MAX_SIZe = 2;
let QUEUE_SIZE = 0;

// console.log(reverseHex('b8023849cd5fe7ccbe6e185408cb4e3a9acd4c98ed47919934e5d935d23024fa'));
// process.exit();

(function miner() {
    let block: Block;
    let resultResult;
    let queueId: string;
    let waitForQueueToProcess: CallableFunction;
    let chainHeight: number;
    let blockOptions: AddBlockOptions = {
        chainHeight: 0,
        blockNamesForHeight: [],
    };

    const minerLoop = function (mining, addr) {
        // console.log('Mine addr', addr);
        // 
        QUEUE_SIZE++;

        mining.createNextBlock(addr).then(function (block: Block) {
            console.log('new block name ' + block.height + ' ' + block.name);
            // console.log('new block height ' + block.height);
            mining.mine(block, addr).then(function (resultResult) {

                block.target = resultResult['target'];
                block.nonce = resultResult['nonce'];
                block.hash = resultResult['hash'];
                block.weight = resultResult['weight'];
                block.chainWeight += block.weight;

                chainRepo.addBlock(block).then(function () {
                    QUEUE_SIZE--;
                    console.log('ADDED ' + block.name)


                    setTimeout(function () {
                        minerLoop(mining1, address1);
                    }, 1)
                }).catch((error) => {
                    QUEUE_SIZE--;
                    console.log(error)
                });



            }).catch((error) => {
                console.log(error)
            });

        });







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

    setTimeout(function () {
        minerLoop(mining1, address1);
    }, 1);

    // setTimeout(function () {
    //     minerLoop(mining2, address2);
    // }, 1);
})();

// setInterval(() => {
//     console.log((process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + 'mb');
// }, 5000);
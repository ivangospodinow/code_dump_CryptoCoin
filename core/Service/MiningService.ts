import Storage from "../Storage/Storage";
import Block from "../Block/Block";
import settings from '../../settings';
import SettingsRepo from '../Repo/SettingsRepo';
import BlockModel from "../Block/BlockModel";
import Address from "../Address/Address";
import BlockRepo from "../Repo/BlockRepo";
import PoolRepo from "../Repo/PoolRepo";
import BlockValidator from "../Validator/BlockValidator";
import { sha256x2, getSecondsBetweenDates, numberToHex, getTimestampString } from "../tools";
import EventsManager from "../Events/EventManager";
import { resolveAny } from "dns";
import ChainRepo from "../Repo/ChainRepo";
import { parse } from "path";
const bcrypt = require('bcrypt');

export type MineResult = { nonce: string, target: number, hash: number, weight: number };
export type MinedResult = { result: number, target: number, workDone: number, hash: number };

let BLOCK_ADDED: Block | undefined = undefined;

export default class MiningService {
    settingsRepo: SettingsRepo;
    blockModel: BlockModel;
    blockRepo: BlockRepo;
    poolRepo: PoolRepo;
    eventsManager: EventsManager;
    chainRepo: ChainRepo;
    blockAdded?: Block;

    constructor(settingsRepo: SettingsRepo, blockModel: BlockModel, blockRepo: BlockRepo, poolRepo: PoolRepo, eventsManager: EventsManager, chainRepo: ChainRepo) {
        this.settingsRepo = settingsRepo;
        this.blockModel = blockModel;
        this.blockRepo = blockRepo;
        this.poolRepo = poolRepo;
        this.eventsManager = eventsManager;
        this.chainRepo = chainRepo;

        // @TODO uncommnet
        // this.eventsManager.on('blockAdded', function blockAddedEventCallback(block: Block) {
        //     BLOCK_ADDED = block;
        // });
    }

    // createAndMineNextBlock = (address: Address): Promise<Block> => {
    //     return new Promise(async function createAndMineNextBlockPromise(this: MiningService, resolve: CallableFunction, reject: any) {
    //         try {
    //             const block = await this.createNextBlock(address);
    //             const resultResult = await this.mine(block);
    //             block.target = resultResult['target'];
    //             block.nonce = resultResult['nonce'];
    //             console.log('Mined ' + block.height + ' target ' + block.target);
    //             resolve(block);
    //         } catch (error) {
    //             reject(error);
    //         }
    //     }.bind(this));
    // }

    /**
     * @param address
     */
    async createNextBlock(address: Address): Promise<Block> {
        const lastBlock = await this.blockRepo.getBlockByName(await this.settingsRepo.getLastBlockName());
        const block = this.blockModel.createCandidate(address, lastBlock);
        block.timestamp = getTimestampString();
        // const poolTransactions = await this.poolRepo.getTransactionsForBlockMining();
        // for (let t in poolTransactions) {
        //     block.transactions.push(poolTransactions[t]);
        // }

        this.blockModel.prepareCandidate(block);
        // console.log('Block candidate created ' + block.height);
        return block;
    }

    mine = (block: Block, address: Address): Promise<MineResult> => {
        return new Promise(async function minePromise(this: MiningService, resolve: CallableFunction, reject: any) {
            const mineBase = this.createMiningHashBase(block);
            const target = await this.getTarget(block);

            console.log('Target ' + target);
            let totalHashes = 0;
            let counter = 0;
            let result;
            let resultInt;
            let signedHash;

            const hasingLoop = function () {

                /**
                 * Make sure that minings stops when new block is added
                 */
                if (BLOCK_ADDED && BLOCK_ADDED.height >= block.height) {
                    console.log('Mining STOPPED, block outdated');
                    return reject(new Error('Block outdated'));
                } else if (BLOCK_ADDED && BLOCK_ADDED.height < block.height) {
                    BLOCK_ADDED = undefined;
                }

                bcrypt.genSalt(settings.BCRYPT_SALT_SIZE, function (err: any, salt: string) {
                    if (err) {
                        return reject(err);
                    }
                    bcrypt.hash(mineBase, salt, function (err: any, hash: string) {
                        if (err) {
                            reject(err);
                        }

                        if (counter++ >= 10) {
                            // process.stdout.write('|');
                            counter = 0;
                        }
                        totalHashes++;

                        result = sha256x2(hash);
                        signedHash = address.sign(result);
                        result = sha256x2(signedHash);
                        resultInt = parseInt(result, 16);

                        // console.log(resultInt, '<=', target)
                        if (resultInt <= target) {
                            console.log('block found ', block.height, block.name)
                            console.log('TOTAL HASHES ---------------', totalHashes)
                            return resolve({
                                nonce: salt,
                                target: numberToHex(target),
                                hash: signedHash,
                                // lower is harder to get
                                weight: 1 - resultInt / parseInt(settings.MAX_TARGET, 16),
                            });
                        } else {
                            return setTimeout(hasingLoop, 1);
                        }
                    });
                });
            };

            hasingLoop();
        }.bind(this));
    }

    verifyMinedBlock = (block: Block): Promise<boolean> => {
        return new Promise(async function getMininResultPromise(this: MiningService, resolve: CallableFunction, reject: any) {
            const target = await this.getTarget(block);

            bcrypt.hash(this.createMiningHashBase(block), block.nonce, function (err: any, hash: string) {
                if (err) {
                    return reject(err);
                }

                const coinBaseAddress = block.getCoinBaseAddress();
                if (!coinBaseAddress) {
                    return resolve(false);
                }

                let result = sha256x2(hash);
                if (!coinBaseAddress.verify(result, block.hash)) {
                    return resolve(false);
                }

                let minedResult = parseInt(sha256x2(block.hash), 16);
                // 5% tolerance 
                if (minedResult <= target * 1.05) {
                    return resolve(true);
                }

                return resolve(false);
            });
        }.bind(this));
    }

    getMinedResult = (block: Block): Promise<MinedResult> => {
        return new Promise(async function getMininResultPromise(this: MiningService, resolve: CallableFunction, reject: any) {
            const target = await this.getTarget(block);
            bcrypt.hash(this.createMiningHashBase(block), block.nonce, function (err: any, hash: string) {
                if (err) {
                    return reject(err);
                }
                const result = numberToHex(parseInt(sha256x2(hash), 16));


                resolve({
                    target: target,
                    result: result,
                    workDone: settings.MAX_TARGET / result,
                    hash: parseInt(sha256x2(hash), 16),
                });
            });
        }.bind(this));
    }

    createMiningHashBase = (block: Block) => {
        return [
            block.prevBlockName,
            block.name,
        ].join('');
    }

    getTarget = (block: Block): Promise<number> => {
        return new Promise(async function minePromise(this: MiningService, resolve: CallableFunction, reject: any): number {

            // @todo remove this
            if (block.height === 1) {
                return resolve(parseInt(settings.MAX_TARGET, 16));
            }

            // @TODO remove
            // return resolve(settings.FIRST_TARGET);

            if (block.height - 1 < settings.TARGET_BLOKC_TIME_REAJUST) {
                return resolve(parseInt(settings.FIRST_TARGET));
            }

            // @TODO make the reajust after block height unchanged length is known

            // return resolve(settings.FIRST_TARGET);

            const prevTarget = await this.blockRepo.getBlockTargetByName(block.prevBlockName);
            console.log('prevTarget ' + prevTarget, parseInt(prevTarget, 16));
            if ((block.height - 1) % settings.TARGET_BLOKC_TIME_REAJUST !== 0) {
                return resolve(parseInt(prevTarget, 16));
            }
            // console.log('prevBlockName ' + block.prevBlockName);
            const lastBlockTimestamp = await this.blockRepo.getBlockTimestampByName(block.prevBlockName);
            const startBlockTimestamp = await this.blockRepo.getBlockTimestampByName(
                await this.chainRepo.getHeightBlock(block.height - settings.TARGET_BLOKC_TIME_REAJUST)
            );

            const timeElapsed = getSecondsBetweenDates(lastBlockTimestamp, startBlockTimestamp);
            console.log('time elapsed ', timeElapsed)
            let ratio = (timeElapsed / (settings.TARGET_BLOKC_TIME_REAJUST * settings.TARGET_BLOKC_TIME_SEC));
            // if (ratio > 1.05) {
            //     ratio = 1.05
            // } else if (ratio < 0.95) {
            //     ratio = 0.95;
            // }
            console.log('difficulty ratio ' + ratio)
            // console.log('getTarget', ratio, lastBlockTimestamp, startBlockTimestamp)
            // console.log('timeElapsed ' + timeElapsed);
            // console.log('lastBlockTimestamp ' + lastBlockTimestamp);
            // console.log('startBlockTimestamp ' + startBlockTimestamp);


            const target = Math.floor(ratio * parseInt(prevTarget, 16));


            if (target > parseInt(settings.MAX_TARGET, 16)) {
                return parseInt(settings.MAX_TARGET, 16);
            }
            return resolve(target);
        }.bind(this));
    }
}

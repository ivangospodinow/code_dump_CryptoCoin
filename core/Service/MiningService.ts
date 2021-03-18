import Storage from "../Storage/Storage";
import Block from "../Block/Block";
import settings from '../../settings';
import SettingsRepo from '../Repo/SettingsRepo';
import BlockModel from "../Block/BlockModel";
import Address from "../Address/Address";
import BlockRepo from "../Repo/BlockRepo";
import PoolRepo from "../Repo/PoolRepo";
import BlockValidator from "../Validator/BlockValidator";
import { sha256x2, getSecondsBetweenDates, numberToHex, rand } from "../tools";
import EventsManager from "../Events/EventManager";
import { resolveAny } from "dns";
const bcrypt = require('bcrypt');

export type MineResult = { nonce: string, target: number };
export type MinedResult = { result: number, target: number, workDone: number };

let BLOCK_ADDED: Block | undefined = undefined;

export default class MiningService {
    settingsRepo: SettingsRepo;
    blockModel: BlockModel;
    blockRepo: BlockRepo;
    poolRepo: PoolRepo;
    eventsManager: EventsManager;
    blockAdded?: Block;

    constructor(settingsRepo: SettingsRepo, blockModel: BlockModel, blockRepo: BlockRepo, poolRepo: PoolRepo, eventsManager: EventsManager) {
        this.settingsRepo = settingsRepo;
        this.blockModel = blockModel;
        this.blockRepo = blockRepo;
        this.poolRepo = poolRepo;
        this.eventsManager = eventsManager;

        this.eventsManager.on('blockAdded', function blockAddedEventCallback(block: Block) {
            BLOCK_ADDED = block;
        });
    }

    createAndMineNextBlock = (address: Address): Promise<Block> => {
        return new Promise(async function createAndMineNextBlockPromise(this: MiningService, resolve: CallableFunction, reject: any) {
            try {
                const block = await this.createNextBlock(address);
                const resultResult = await this.mine(block);
                block.target = resultResult['target'];
                block.nonce = resultResult['nonce'];
                console.log('Mined ' + block.height + ' target ' + block.target);
                resolve(block);
            } catch (error) {
                reject(error);
            }
        }.bind(this));
    }

    /**
     * @param address
     */
    async createNextBlock(address: Address): Promise<Block> {
        const lastBlock = await this.blockRepo.getBlockByName(await this.settingsRepo.getLastBlockName());
        const block = this.blockModel.createCandidate(address, lastBlock);
        // const poolTransactions = await this.poolRepo.getTransactionsForBlockMining();
        // for (let t in poolTransactions) {
        //     block.transactions.push(poolTransactions[t]);
        // }

        this.blockModel.prepareCandidate(block);
        // console.log('Block candidate created ' + block.height);
        return block;
    }

    mine = (block: Block): Promise<MineResult> => {
        return new Promise(async function minePromise(this: MiningService, resolve: CallableFunction, reject: any) {
            const mineBase = this.createMiningHashBase(block);
            const target = await this.getTarget(block);
            let counter = 0;

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

                        if (parseInt(sha256x2(hash), 16) <= target) {
                            return resolve({
                                nonce: salt,
                                target: target
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
        return new Promise(async function minePromise(this: MiningService, resolve: CallableFunction, reject: any) {

            // @todo remove this
            if (block.height === 1) {
                return resolve(settings.MAX_TARGET);
            }

            // @TODO remove
            // return resolve(settings.FIRST_TARGET);

            if (block.height - 1 < settings.TARGET_BLOKC_TIME_REAJUST) {
                return resolve(settings.FIRST_TARGET);
            }

            const prevTarget = await this.blockRepo.getBlockTargetByName(block.prevBlockName);
            if ((block.height - 1) % settings.TARGET_BLOKC_TIME_REAJUST !== 0) {
                return resolve(prevTarget);
            }
            console.log('prevBlockName ' + block.prevBlockName);
            const lastBlockTimestamp = await this.blockRepo.getBlockTimestampByName(block.prevBlockName);
            const startBlockTimestamp = await this.blockRepo.getBlockTimestampByName(
                await this.blockRepo.getBlockNameByHeight(block.height - settings.TARGET_BLOKC_TIME_REAJUST)
            );

            const timeElapsed = getSecondsBetweenDates(lastBlockTimestamp, startBlockTimestamp);
            let ratio = (timeElapsed / (settings.TARGET_BLOKC_TIME_REAJUST * settings.TARGET_BLOKC_TIME_SEC));
            if (ratio > 1.25) {
                ratio = 1.25
            } else if (ratio < 0.25) {
                ratio = 0.25;

            }
            console.log('getTarget', ratio, lastBlockTimestamp, startBlockTimestamp)
            console.log('timeElapsed ' + timeElapsed);
            console.log('lastBlockTimestamp ' + lastBlockTimestamp);
            console.log('startBlockTimestamp ' + startBlockTimestamp);

            const target = numberToHex(ratio * prevTarget);
            if (target > settings.MAX_TARGET) {
                return resolve(settings.MAX_TARGET);
            }
            return resolve(target);
        }.bind(this));
    }
}

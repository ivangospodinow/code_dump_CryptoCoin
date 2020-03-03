import Storage from "../Storage/Storage";
import Block from "../Block/Block";
import settings from '../../settings';
import SettingsRepo from '../Repo/SettingsRepo';
import BlockModel from "../Block/BlockModel";
import Address from "../Address/Address";
import BlockRepo from "../Repo/BlockRepo";
import PoolRepo from "../Repo/PoolRepo";
import BlockValidator from "../Validator/BlockValidator";
import { sha256x2, getSecondsBetweenDates } from "../tools";
const bcrypt = require('bcrypt');

export type MineResult = { nonce: string, difficulty: number };

export default class MiningService {
    settingsRepo: SettingsRepo;
    blockModel: BlockModel;
    blockRepo: BlockRepo;
    poolRepo: PoolRepo;

    constructor(settingsRepo: SettingsRepo, blockModel: BlockModel, blockRepo: BlockRepo, poolRepo: PoolRepo) {
        this.settingsRepo = settingsRepo;
        this.blockModel = blockModel;
        this.blockRepo = blockRepo;
        this.poolRepo = poolRepo;
    }

    /**
     * @param address
     */
    async createNextBlock(address: Address): Promise<Block> {
        const lastBlock = await this.blockRepo.getBlockByName(await this.settingsRepo.getLastBlockName());
        const block = this.blockModel.createCandidate(address, lastBlock);
        const poolTransactions = await this.poolRepo.getTransactionsForBlockMining();
        for (let t in poolTransactions) {
            block.transactions.push(poolTransactions[t]);
        }

        this.blockModel.prepareCandidate(block);

        return block;
    }

    mine = (block: Block): Promise<MineResult> => {
        return new Promise(async function minePromise(this: MiningService, resolve: CallableFunction, reject: any) {
            const mineBase = this.createMiningHashBase(block);
            const leadingZeros = await this.getLeadingZeros(block);
            const leadingZerosString = '0'.repeat(leadingZeros);
            let counter = 0;
            const hasingLoop = function () {
                bcrypt.genSalt(settings.BCRYPT_SALT_SIZE, function (err: any, salt: string) {
                    if (err) {
                        reject(err);
                    }
                    bcrypt.hash(mineBase, salt, function (err: any, hash: string) {
                        if (err) {
                            reject(err);
                        }

                        if (counter++ >= 10) {
                            process.stdout.write('|');
                            counter = 0;
                        }

                        if (sha256x2(hash).substr(0, leadingZeros) !== leadingZerosString) {
                            hasingLoop();
                        } else {
                            resolve({
                                nonce: salt,
                                difficulty: leadingZeros,
                            });
                        }
                    });
                });
            };
            hasingLoop();
        }.bind(this));
    }

    createMiningHashBase = (block: Block) => {
        return [
            block.prevBlockName,
            block.name,
        ].join('');
    }

    getLeadingZeros = (block: Block) : Promise<number> => {
        return new Promise(async function minePromise(this: MiningService, resolve: CallableFunction, reject: any) {
            if (block.height - 1 < settings.TARGET_BLOKC_TIME_REAJUST) {
                return resolve(1);
            }
            
            const prevDifficulty = await this.blockRepo.getBlockDifficultyByName(block.prevBlockName);
            if ((block.height - 1) %  settings.TARGET_BLOKC_TIME_REAJUST !== 0) {
                return resolve(prevDifficulty);
            }
            
            const lastBlockTimestamp = await this.blockRepo.getBlockTimestampByName(block.prevBlockName);
            const startBlockTimestamp = await this.blockRepo.getBlockTimestampByName(
                await this.blockRepo.getBlockNameByHeight(block.height - (1 + settings.TARGET_BLOKC_TIME_REAJUST))
            );
            
            const timeElapsed = getSecondsBetweenDates(lastBlockTimestamp, startBlockTimestamp);
            if (timeElapsed / settings.TARGET_BLOKC_TIME_REAJUST < settings.TARGET_BLOKC_TIME_SEC) {
                return resolve(prevDifficulty + 1);
            } else {
                return resolve(prevDifficulty - 1);
            }
        }.bind(this));
    }
}

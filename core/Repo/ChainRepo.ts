import Block from "../Block/Block";
import Storage from "../Storage/Storage";
import { json } from "../tools";
import settings from '../../settings';
import SettingsRepo from "./SettingsRepo";
import BlockValidator from "../Validator/BlockValidator";
import BlockRepo from "./BlockRepo";
import { miningService } from "../../globals";
import MiningService from "../Service/MiningService";
import EventsManager from "../Events/EventManager";


export const NAMESPACE = 'chain';

export type QueueType = { block: Block, resolve: CallableFunction, reject: any };

export default class ChainRepo {
    storage: Storage;
    settingsRepo: SettingsRepo;
    validator: BlockValidator;
    blockRepo: BlockRepo;
    miningService: MiningService;
    eventsManager: EventsManager;

    private queue: Array<QueueType> = [];
    private queueInterval: any;

    constructor(
        storage: Storage,
        settingsRepo: SettingsRepo,
        validator: BlockValidator,
        blockRepo: BlockRepo,
        eventsManager: EventsManager
    ) {
        this.storage = storage;
        this.settingsRepo = settingsRepo;
        this.validator = validator;
        this.blockRepo = blockRepo;
        this.eventsManager = eventsManager;

        let queue: QueueType | undefined;
        let processing: boolean = false;

        this.queueInterval = setInterval(async function (this: ChainRepo) {
            if (!processing) {
                processing = true;
                queue = this.queue.pop();
                if (queue) {
                    this.processAddedBlock(queue.block).then(function processAddedBlockSuccessCallback(result: boolean) {
                        queue.resolve(result);
                        processing = false;
                    }).catch(function () {
                        queue.reject();
                        processing = false;
                    });
                } else {
                    processing = false;
                }
            }
        }.bind(this), 15);
    }

    setMiningService = (mining: MiningService) => {
        this.miningService = mining;
    }

    getHeightBlockNames = (height: number): Promise<Array<string>> => {
        return new Promise(async function getHeightBlockNamesPromise(this: ChainRepo, resolve: CallableFunction, reject: any) {
            this.storage.get(NAMESPACE, 'height_block_names.' + height).then((result: string) => {
                resolve(result.length ? json(result) : []);
            }).catch(reject);
        }.bind(this));
    }

    setHeightBlockNames = (height: number, names: Array<string>): Promise<CallableFunction> => {
        return this.storage.put(NAMESPACE, 'height_block_names.' + height, names);
    }

    getHeightBlock = (height: number) => {
        return this.storage.get(NAMESPACE, 'height.' + height);
    }

    setHeightBlock = (height: number, blockName: string) => {
        return this.storage.put(NAMESPACE, 'height.' + height, blockName);
    }

    validateAndAddBlocks = (blocks: Block[]): Promise<boolean[]> => {
        return Promise.all(blocks.map(block => this.validateAndAddBlock(block)));
    }

    validateAndAddBlock = (block: Block): Promise<boolean> => {
        return new Promise(async function validateAndAddBlockPrimise(this: ChainRepo, resolve: CallableFunction, reject: any) {
            const blockMiningIsValid = await this.miningService.verifyMinedBlock(block);
            if (!blockMiningIsValid) {
                return resolve(false);
            }

            const isBlockValid = this.validator.isBlockValid(block);
            if (!isBlockValid) {
                return resolve(false);
            }
            // @TODO validate UTXO
            const added: boolean = await this.addBlock(block);
            if (added) {
                this.eventsManager.emitNext('blockAdded', block);
            }

            resolve(added);

        }.bind(this));
    }

    addBlock = (block: Block): Promise<boolean> => {
        return new Promise(async function addBlockPrimise(this: ChainRepo, resolve: CallableFunction, reject: any) {

            this.blockRepo.addBlock(block).then(function addBlockToRepo(this: ChainRepo) {
                console.log('Block added to storage ', block.height, block.name)

                this.queue.push({ block, resolve, reject });
            }.bind(this)).catch(function addBlockToRepoError(error) {
                console.error(error);
                resolve(false);
            });
        }.bind(this));
    }

    private processAddedBlock(block: Block): Promise<boolean> {
        return new Promise(async function processAddedBlockPrimise(this: ChainRepo, resolve: CallableFunction, reject: any) {
            const heightBlockNames: Array<string> = await this.getHeightBlockNames(block.height);
            if (heightBlockNames.includes(block.name)) {
                console.log('Block aready included in height ' + block.height + ' ' + block.name);
                reject();
            } else {
                heightBlockNames.push(block.name);
                await this.setHeightBlockNames(block.height, heightBlockNames);
                await this.resolveChain(block, heightBlockNames);
                console.log('Chain updated with ', block.height, block.name)
                resolve(true);
            }
        }.bind(this));
    }

    private resolveChain = (block: Block, heightBlockNames: Array<string>) => {
        return new Promise(async function resolveChainPrimise(this: ChainRepo, resolve: CallableFunction, reject: any) {
            if (heightBlockNames.length === 1) {
                await this.setHeightBlock(block.height, block.name);
                await this.settingsRepo.setSetting(settings.LAST_BLOCK_HEIGHT_KEY, String(block.height));
                await this.settingsRepo.setSetting(settings.LAST_BLOCK_NAME_KEY, block.name);
            } else {
                const topBlock = await this.resolveBestChain(heightBlockNames);
                await this.propagateTopBlock(topBlock);
            }

            resolve(true);

        }.bind(this));
    }

    private resolveBestChain = (heightBlockNames: Array<string>): Promise<Block> => {
        return new Promise(async function resolveBestChainPrimise(this: ChainRepo, resolve: CallableFunction, reject: any) {
            let topBlock: Block | undefined;
            let loopBlock: Block;

            for (const name of heightBlockNames) {
                loopBlock = await this.getChainTop(name);
                // in case of equal weighs, the next one will decide
                if (!topBlock || topBlock.chainWeight < loopBlock.chainWeight) {
                    topBlock = loopBlock;
                }
            }

            if (topBlock) {
                resolve(topBlock);
            } else {
                reject();
            }
        }.bind(this));
    }

    private propagateTopBlock = (topBlock: Block) => {
        return new Promise(async function propagateTopBlockPrimise(this: ChainRepo, resolve: CallableFunction, reject: any) {
            // update last block
            await this.setHeightBlock(topBlock.height, topBlock.name);
            await this.settingsRepo.setSetting(settings.LAST_BLOCK_HEIGHT_KEY, String(topBlock.height));
            await this.settingsRepo.setSetting(settings.LAST_BLOCK_NAME_KEY, topBlock.name);

            // @TODO transactions

            resolve(true);
        }.bind(this));
    }

    getChainTop = (blockName: string): Promise<Block> => {
        return new Promise(async function getChainTopPrimise(this: ChainRepo, resolve: CallableFunction, reject: any) {
            let lastBlockName = blockName;
            let nextBlockName = '';
            while (true) {
                nextBlockName = await this.blockRepo.getNextBlockNameByName(blockName);
                if (nextBlockName.length) {
                    lastBlockName = nextBlockName;
                } else {
                    break;
                }
            }
            resolve(await this.blockRepo.getBlockByName(lastBlockName));
        }.bind(this));
    }
}


// data.push({
//     namespace: 'setting',
//     key: settings.LAST_BLOCK_HEIGHT_KEY,
//     value: block.height,
// });

// data.push({
//     namespace: 'setting',
//     key: settings.LAST_BLOCK_NAME_KEY,
//     value: block.name,
// });
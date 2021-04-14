import Block, { BlockStatusType, BLOCK_STATUS_MINED, BLOCK_STATUS_VALID, BLOCK_STATUS_VALID_FORK, BLOCK_STATUS_INVALID } from "../Block/Block";
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
                    this.processQueuedBlock(queue.block).then(function processQueuedBlockSuccessCallback(result: boolean) {
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

    addBlock = (block: Block): Promise<boolean> => {
        return new Promise(async function addBlockPrimise(this: ChainRepo, resolve: CallableFunction, reject: any) {
            this.queue.push({ block, resolve, reject });
        }.bind(this));
    }

    addBlocks = (blocks: Block[]): Promise<boolean[]> => {
        return Promise.all(blocks.map(block => this.addBlock(block)));
    }



    // validateAndAddBlock = (block: Block): Promise<boolean> => {
    //     return new Promise(async function validateAndAddBlockPrimise(this: ChainRepo, resolve: CallableFunction, reject: any) {
    //         const blockMiningIsValid = await this.miningService.verifyMinedBlock(block);
    //         if (!blockMiningIsValid) {
    //             return resolve(false);
    //         }

    //         const isBlockValid = this.validator.isBlockValid(block);
    //         if (!isBlockValid) {
    //             return resolve(false);
    //         }

    //         block.status = BLOCK_STATUS_VALID_FORK;
    //         // @TODO validate UTXO
    //         const added: boolean = await this.addBlock(block);
    //         if (added) {
    //             this.eventsManager.emitNext('blockAdded', block);
    //         }

    //         resolve(added);

    //     }.bind(this));
    // }

    processQueuedBlock = (block: Block) => {
        return new Promise(async function addBlockPrimise(this: ChainRepo, resolve: CallableFunction, reject: any) {
            const heightBlockNames: Array<string> = await this.getHeightBlockNames(block.height);
            if (heightBlockNames.includes(block.name)) {
                return resolve(false);
            }

            let blockAdded: boolean = false;
            // if block is mined and its first
            if (block.status === BLOCK_STATUS_MINED && heightBlockNames.length === 0) {
                block.status = BLOCK_STATUS_VALID;
                blockAdded = await this.blockRepo.addBlock(block);
                if (blockAdded) {
                    heightBlockNames.push(block.name);
                    await this.setHeightBlockNames(block.height, heightBlockNames);
                    await this.setActiveBlockForHeight(block);
                }
                return resolve(blockAdded);
            }

            block.status = BLOCK_STATUS_INVALID;
            if (!await this.miningService.verifyMinedBlock(block)) {
                return resolve(false);
            }

            if (!this.validator.isBlockValid(block)) {
                return resolve(false);
            }

            // @TODO validate UTXO

            block.status = heightBlockNames.length === 0 ? BLOCK_STATUS_VALID : BLOCK_STATUS_VALID_FORK;
            blockAdded = await this.blockRepo.addBlock(block);
            if (!blockAdded) {
                return resolve(false);
            }
            heightBlockNames.push(block.name);
            await this.setHeightBlockNames(block.height, heightBlockNames);

            if (heightBlockNames.length > 1) {
                await this.resolveBestChain(heightBlockNames);
            } else {
                await this.setActiveBlockForHeight(block);
            }

            return resolve(true);


        }.bind(this));
    }

    private async setActiveBlockForHeight(block: Block) {
        await this.setHeightBlock(block.height, block.name);
        await this.settingsRepo.setSetting(settings.LAST_BLOCK_HEIGHT_KEY, String(block.height));
        await this.settingsRepo.setSetting(settings.LAST_BLOCK_NAME_KEY, block.name);
    }

    // addBlock = (block: Block): Promise<boolean> => {
    //     return new Promise(async function addBlockPrimise(this: ChainRepo, resolve: CallableFunction, reject: any) {
    //         let initialBlockStatus = block.status;
    //         const heightBlockNames: Array<string> = await this.getHeightBlockNames(block.height);


    //         this.blockRepo.addBlock(block).then(function addBlockToRepo(this: ChainRepo) {
    //             console.log('Block added to storage ', block.height, block.name)

    //             this.queue.push({ block, resolve, reject });
    //         }.bind(this)).catch(function addBlockToRepoError(error) {
    //             console.error(error);
    //             resolve(false);
    //         });
    //     }.bind(this));
    // }


    // public processAddedBlock(block: Block): Promise<boolean> {
    //     return new Promise(async function processAddedBlockPrimise(this: ChainRepo, resolve: CallableFunction, reject: any) {
    //         console.log('Process block after added ' + block.height + ' ' + block.name);

    //         const heightBlockNames: Array<string> = await this.getHeightBlockNames(block.height);
    //         if (heightBlockNames.includes(block.name)) {
    //             console.log('Block aready included in height ' + block.height + ' ' + block.name);
    //             resolve(false);
    //         } else {
    //             heightBlockNames.push(block.name);
    //             await this.setHeightBlockNames(block.height, heightBlockNames);
    //             console.log('Block names updated for ', block.height)
    //             await this.resolveChain(block, heightBlockNames);
    //             console.log('Chain updated with ', block.height, block.name)
    //             resolve(true);
    //         }
    //     }.bind(this));
    // }

    // private resolveChain = (block: Block, heightBlockNames: Array<string>) => {
    //     return new Promise(async function resolveChainPrimise(this: ChainRepo, resolve: CallableFunction, reject: any) {
    //         if (heightBlockNames.length === 1) {
    //             console.log('One block for heigt ', block.height)
    //             await this.setHeightBlock(block.height, block.name);
    //             await this.settingsRepo.setSetting(settings.LAST_BLOCK_HEIGHT_KEY, String(block.height));
    //             await this.settingsRepo.setSetting(settings.LAST_BLOCK_NAME_KEY, block.name);
    //             this.blockRepo.updateStatus(block.name, BLOCK_STATUS_VALID);
    //         } else {
    //             console.log('Best Chain Resolve START ', block.height, block.name)
    //             await this.resolveBestChain(heightBlockNames);
    //             console.log('Best Chain RESOLVED')
    //             // await this.propagateTopBlock(topBlock);
    //         }

    //         resolve(true);

    //     }.bind(this));
    // }

    private resolveBestChain = (heightBlockNames: Array<string>): Promise<Block | undefined> => {
        return new Promise(async function resolveBestChainPrimise(this: ChainRepo, resolve: CallableFunction, reject: any) {
            let topBlock: Block | undefined;
            let loopBlock: Block;
            let topBlocks: Array<Block> = [];

            for (let name of heightBlockNames) {
                loopBlock = await this.getChainTop(name);
                topBlocks.push(loopBlock);

                // in case of equal weighs, the next one will decide
                if (!topBlock || topBlock.chainWeight < loopBlock.chainWeight) {
                    topBlock = loopBlock;
                }
            }

            if (!topBlock) {
                return resolve(undefined);
            }

            const chains = await this.getBlocksChains(topBlocks);
            let i: any;
            let topCainKey: any;
            let topChainWeight: number = 0;

            for (i in chains) {
                if (chains[i][0].chainWeight > topChainWeight) {
                    topCainKey = i;
                    topChainWeight = chains[i][0].chainWeight;
                }
            }

            let data = this.createChainStatusUpdate(chains[topCainKey], [], BLOCK_STATUS_VALID);
            let validForkData: Array<any>;

            /**
             * Tripple chain fork - 2 of the 3 may have common root and it can from the longest chain.
             * Exclude such blocks from setting status valid-fork
             */
            let excludeBlocks: Array<string> = chains[topCainKey].map(topChainBlock => topChainBlock.name);

            for (i in chains) {
                if (i != topCainKey) {
                    validForkData = this.createChainStatusUpdate(chains[i], excludeBlocks, BLOCK_STATUS_VALID_FORK);
                    data = [...data, ...validForkData];
                }
            }

            data.push({
                namespace: 'setting',
                key: settings.LAST_BLOCK_HEIGHT_KEY,
                value: String(chains[topCainKey][0].height),
            });

            data.push({
                namespace: 'setting',
                key: settings.LAST_BLOCK_NAME_KEY,
                value: chains[topCainKey][0].name,
            });

            // @TODO transactions

            await this.storage.puts(data);

            // @TODO recheck the logic
            // @TODO enable for testing only
            let lastHeight = await this.settingsRepo.getLastBlockHeight();
            let blockName: string;
            let status: string;
            while (lastHeight > 0) {
                blockName = await this.getHeightBlock(lastHeight);
                status = await this.blockRepo.getBlockStatus(blockName);
                if (status !== 'valid') {
                    console.log(chains, data)
                    console.log('Block height is not active ', lastHeight)
                    process.exit();
                }
                lastHeight--;
            }

            resolve(topBlock);
        }.bind(this));
    }

    public getBlocksChains(topBlocks: Array<Block>): Promise<Array<Array<Block>>> {
        return new Promise(async function resolveBestChainPrimise(this: ChainRepo, resolve: CallableFunction, reject: any) {
            console.log('getBlocksChains')
            let lowestChainHeight = Number.MAX_SAFE_INTEGER;
            let chains: Array<Array<Block>> = [];

            let tmpBlock: Block;

            topBlocks.forEach((topBlockLoop: Block) => {
                if (topBlockLoop.height < lowestChainHeight) {
                    lowestChainHeight = topBlockLoop.height;
                }
                chains.push([topBlockLoop]);
            });

            let addedBlock: boolean = false;

            while (true) {
                addedBlock = false;
                for (let i in chains) {
                    tmpBlock = chains[i][chains[i].length - 1];
                    if (tmpBlock.height > lowestChainHeight) {
                        chains[i].push(await this.blockRepo.getBlockByName(tmpBlock.prevBlockName));
                        addedBlock = true;
                    }
                }
                if (!addedBlock) {
                    break;
                }
            }

            if (this.chainsHaveSameBottom(chains)) {
                return resolve(chains);
            }

            while (true) {
                addedBlock = false;
                for (let i in chains) {
                    tmpBlock = chains[i][chains[i].length - 1];
                    if (tmpBlock.prevBlockName) {
                        chains[i].push(await this.blockRepo.getBlockByName(tmpBlock.prevBlockName));
                        addedBlock = true;
                    }
                }

                if (!addedBlock) {
                    break;
                }

                if (this.chainsHaveSameBottom(chains)) {
                    break;
                }
            }
            return resolve(chains);
        }.bind(this));
    }

    private chainsHaveSameBottom(chains: Array<Array<Block>>): boolean {
        let names: Array<string> = [];
        let blocks: Array<Block>;
        let block: Block;

        for (blocks of chains) {
            block = blocks[blocks.length - 1];
            if (!names.includes(block.prevBlockName)) {
                names.push(block.prevBlockName)
            }
        }
        return names.length === 1;
    }

    private createChainStatusUpdate(chain: Array<Block>, excludeBlocks: Array<string>, status: BlockStatusType): Array<any> {
        let block: Block;
        let data = [];
        for (block of chain) {
            if (!excludeBlocks.includes(block.name)) {
                data.push({
                    namespace: 'block',
                    key: block.name + '.status',
                    value: status,
                });
                if (status === 'valid') {
                    data.push({
                        namespace: NAMESPACE,
                        key: 'height.' + block.height,
                        value: block.name,
                    });
                }
            }

        }
        return data;
    }

    // private propagateTopBlock = (topBlock: Block) => {
    //     return new Promise(async function propagateTopBlockPrimise(this: ChainRepo, resolve: CallableFunction, reject: any) {
    //         // update last block
    //         await this.setHeightBlock(topBlock.height, topBlock.name);
    //         await this.settingsRepo.setSetting(settings.LAST_BLOCK_HEIGHT_KEY, String(topBlock.height));
    //         await this.settingsRepo.setSetting(settings.LAST_BLOCK_NAME_KEY, topBlock.name);

    //         // @TODO transactions

    //         resolve(true);
    //     }.bind(this));
    // }

    getChainTop = (blockName: string): Promise<Block> => {
        return new Promise(async function getChainTopPrimise(this: ChainRepo, resolve: CallableFunction, reject: any) {
            let lastBlockName = blockName;
            let nextBlockName = '';
            while (true) {
                nextBlockName = await this.blockRepo.getNextBlockNameByName(lastBlockName);
                // console.log(nextBlockName)
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
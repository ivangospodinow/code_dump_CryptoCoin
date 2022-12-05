import Block, { BlockStatusType, BLOCK_STATUS_MINED, BLOCK_STATUS_VALID, BLOCK_STATUS_VALID_FORK, BLOCK_STATUS_INVALID } from "../Block/Block";
import Storage, { DATA_REMOVE_VALUE } from "../Storage/Storage";
import { json } from "../tools";
import settings from '../../settings';
import SettingsRepo from "./SettingsRepo";
import BlockValidator from "../Validator/BlockValidator";
import BlockRepo from "./BlockRepo";
import { BLOCK_FACTORY, BLOCK_VALIDATOR, chainValidator, miningService, UTXO_FACTORY } from "../../globals";
import MiningService from "../Service/MiningService";
import EventsManager from "../Events/EventManager";
import UtxoRepo from "./UtxoRepo";
import Transaction from "../Block/Transaction";
import TransactionInput from "../Block/TransactionInput";
import TransactionOutput from "../Block/TransactionOutput";
const fs = require('fs');

export const NAMESPACE = 'chain';

export type QueueType = { block: Block, resolve: CallableFunction, reject: any };
export type ChainType = Array<Block>;
export type ChainsType = Array<ChainType>;

export default class ChainRepo {
    public replay = true;

    storage: Storage;
    settingsRepo: SettingsRepo;
    validator: BlockValidator;
    blockRepo: BlockRepo;
    miningService: MiningService;
    eventsManager: EventsManager;
    utxoRepo: UtxoRepo;

    private queue: Array<QueueType> = [];
    private queueInterval: any;

    constructor(
        storage: Storage,
        settingsRepo: SettingsRepo,
        validator: BlockValidator,
        blockRepo: BlockRepo,
        eventsManager: EventsManager,
        utxoRepo: UtxoRepo
    ) {
        this.storage = storage;
        this.settingsRepo = settingsRepo;
        this.validator = validator;
        this.blockRepo = blockRepo;
        this.eventsManager = eventsManager;
        this.utxoRepo = utxoRepo;

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

            if (this.replay) {
                fs.appendFile(__dirname + '/../../replay_' + settings.NODE + '.txt', BLOCK_FACTORY.createStringFromObject(block) + "\n", function (err) {
                    if (err) throw err;
                    console.log('Saved!');
                });
            }


            const heightBlockNames: Array<string> = await this.getHeightBlockNames(block.height);
            if (heightBlockNames.includes(block.name)) {
                console.log('Block name already in height', block.name);
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
                } else {
                    console.log('Block(mined) name could not be stored to database', block.name);
                }
                return resolve(blockAdded);
            }

            block.status = BLOCK_STATUS_INVALID;
            if (!await this.miningService.verifyMinedBlock(block)) {
                console.log('Block unable to verify mining data', block.name, block.height);
                return resolve(false);
            }

            // @TODO utxo can be spent in current best chain
            // if (!this.validator.isBlockValid(block)) {
            //     return resolve(false);
            // }

            // @TODO validate UTXO

            // received new block
            if (heightBlockNames.length === 0) {
                block = await this.utxoRepo.loadBlockUtxos(block);
                if (this.validator.isBlockValid(block)) {
                    block.status = BLOCK_STATUS_VALID;
                    blockAdded = await this.blockRepo.addBlock(block);
                    if (blockAdded) {
                        heightBlockNames.push(block.name);
                        await this.setHeightBlockNames(block.height, heightBlockNames);
                        await this.setActiveBlockForHeight(block);
                    } else {
                        console.log('Unable to store block', block.name);
                    }
                    return resolve(blockAdded);
                } else {
                    console.log('Block could not be validated', block.name);
                    return resolve(false);
                }
            }

            // console.log('resolve utxo for valid fork')
            // process.exit();

            // @TODO chain length must be validated, may be not needed because blocks to common root are loaded and it can be calcualted easy

            console.log('RESOLVE BEST CHAIN')
            // @TODO may be invalid ?
            block.status = BLOCK_STATUS_VALID_FORK;
            blockAdded = await this.blockRepo.addBlock(block);
            if (!blockAdded) {
                return resolve(false);
            }
            heightBlockNames.push(block.name);
            await this.setHeightBlockNames(block.height, heightBlockNames);

            const bestChainResult = await this.resolveBestChain(heightBlockNames);

            const isChainValid = await chainValidator.isNodeValid();
            if (!isChainValid) {
                console.log('chain invalid', 'best chain result ', bestChainResult);
                process.exit();
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

    private resolveBestChain = (heightBlockNames: Array<string>): Promise<boolean> => {
        return new Promise(async function resolveBestChainPrimise(this: ChainRepo, resolve: CallableFunction, reject: any) {
            let topBlock: Block | undefined;
            let loopBlock: Block;
            let topBlocks: ChainType = [];

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

            console.log('Top block name: ', topBlock.name)

            let chains = await this.getBlocksChains(topBlocks);
            for (let ch of chains) {
                console.log('chain: ', ch[0].height)
            }


            // console.log('chains', chains)
            const chainsDisconected = await this.disconnectChains(chains);
            if (!chainsDisconected) {
                return resolve(false);
            }
            chains = await this.reloadChains(chains);
            chains = await this.filterInvalidChains(chains);
            // validate chains
            if (!chains.length) {
                console.log('All chains invalid ???')
                return resolve(false);
            }

            let i: any;
            let topCainKey: any;
            let topChainWeight: number = 0;

            for (i in chains) {
                if (chains[i][0].chainWeight > topChainWeight) {
                    topCainKey = i;
                    topChainWeight = chains[i][0].chainWeight;
                }
            }

            console.log('Top chain key', topCainKey);

            let data: Array<any> = [];
            // @TODO make only utxo
            let block: Block;
            for (block of chains[topCainKey]) {
                data = [...data, ...this.blockRepo.getBlockData(block)];
            }

            data = [...data, ...this.createChainStatusUpdate(chains[topCainKey], BLOCK_STATUS_VALID)];
            let validForkData: Array<any>;

            /**
             * Tripple chain fork - 2 of the 3 may have common root and it can from the longest chain.
             * Exclude such blocks from setting status valid-fork
             */
            for (i in chains) {
                if (i != topCainKey) {
                    validForkData = this.createChainStatusUpdate(chains[i], BLOCK_STATUS_VALID_FORK);
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
            /// aaaaaaaaaaaaaaaaaaaaaaaaaaa shit



            await this.storage.puts(data);

            resolve(true);
        }.bind(this));
    }

    public getBlocksChains(topBlocks: ChainType): Promise<ChainsType> {
        return new Promise(async function resolveBestChainPrimise(this: ChainRepo, resolve: CallableFunction, reject: any) {

            let lowestChainHeight = Number.MAX_SAFE_INTEGER;
            let chains: ChainsType = [];

            let tmpBlock: Block;

            topBlocks.forEach((topBlockLoop: Block) => {
                if (topBlockLoop.height < lowestChainHeight) {
                    lowestChainHeight = topBlockLoop.height;
                }
                chains.push([topBlockLoop]);
            });

            let addedBlock: boolean = false;
            console.log('lowestChainHeight ', lowestChainHeight)
            while (true) {
                addedBlock = false;
                for (let i in chains) {
                    tmpBlock = chains[i][chains[i].length - 1];
                    if (tmpBlock.height > lowestChainHeight) {
                        chains[i].push(await this.blockRepo.loadFullBlockByName(tmpBlock.prevBlockName));
                        addedBlock = true;
                    }
                }
                if (!addedBlock) {
                    break;
                }
            }

            if (this.chainsHaveSameBottom(chains)) {
                console.log('First has same bottom')
                return resolve(chains);
            }

            while (true) {
                addedBlock = false;
                for (let i in chains) {
                    tmpBlock = chains[i][chains[i].length - 1];
                    if (tmpBlock.prevBlockName) {
                        chains[i].push(await this.blockRepo.loadFullBlockByName(tmpBlock.prevBlockName));
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

    private chainsHaveSameBottom(chains: ChainsType): boolean {
        let names: Array<string> = [];
        let blocks: ChainType;
        let block: Block;

        for (blocks of chains) {
            block = blocks[blocks.length - 1];
            if (!names.includes(block.prevBlockName)) {
                names.push(block.prevBlockName)
            }
        }
        return names.length === 1;
    }

    private createChainStatusUpdate(chain: ChainType, status: BlockStatusType): Array<any> {
        let block: Block;
        let data = [];
        for (block of chain) {
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

            resolve(await this.blockRepo.loadFullBlockByName(lastBlockName));
        }.bind(this));
    }

    /**
     * @TODO fix this.
     */
    disconnectChains = (chains: ChainsType): Promise<boolean> => {

        return new Promise(async function disconnectChainsPrimise(this: ChainRepo, resolve: CallableFunction, reject: any) {
            let chain: ChainType;
            let block: Block;
            let transaction: Transaction;
            let input: TransactionInput;
            let output: TransactionOutput;

            let add = [];
            let remove = [];

            for (chain of chains) {
                for (block of chain) {

                    // reset status of  block
                    add.push({
                        namespace: 'block',
                        key: block.name + '.status',
                        value: BLOCK_STATUS_VALID_FORK,
                    });

                    // remove block from current chain
                    remove.push({
                        namespace: NAMESPACE,
                        key: 'height.' + block.height,
                        value: DATA_REMOVE_VALUE,
                    });

                    for (transaction of block.transactions) {

                        for (input of transaction.inputs) {
                            if (input.output) {
                                add.push({
                                    namespace: 'utxo',
                                    key: UTXO_FACTORY.createKeyFromOutputObject(input.output),
                                    value: { blockHeight: block.height, ...UTXO_FACTORY.createArrayFromOutputObject(input.output) },
                                });
                            } else if (!input.isCoinbaseInput()) {
                                console.error('Input -> output reference is required for non coinbase inputs.');
                                process.exit();
                            }

                        }

                        for (output of transaction.outputs) {
                            remove.push({
                                namespace: 'utxo',
                                key: 'output.' + transaction.name + '.' + output.num,
                                value: DATA_REMOVE_VALUE,
                            });
                        }
                    }
                }
            }

            let data = [...remove, ...add];
            // console.log(data)
            this.storage.puts(data).then(function () {
                resolve(true);
            }).catch(function () {
                resolve(false);
            });

        }.bind(this));
    }

    reloadChains = (chains: ChainsType): Promise<ChainsType> => {
        return new Promise(async function disconnectChainsPrimise(this: ChainRepo, resolve: CallableFunction, reject: any) {
            const reloadedChains = [];
            let reloadChain: ChainType;

            let chain: ChainType;
            let block: Block;

            for (chain of chains) {
                reloadChain = [];
                for (block of chain) {
                    reloadChain.push(await this.utxoRepo.loadBlockUtxos(await this.blockRepo.loadFullBlockByName(block.name)));

                }
                reloadedChains.push(reloadChain);
            }

            return resolve(reloadedChains);
        }.bind(this));
    }

    filterInvalidChains = (chains: ChainsType): Promise<ChainsType> => {
        return new Promise(async function disconnectChainsPrimise(this: ChainRepo, resolve: CallableFunction, reject: any) {
            const validatedChains: ChainsType = [];
            let chainIsValid: boolean = true;

            let chain: ChainType;
            let block: Block;

            for (chain of chains) {
                chainIsValid = true;
                for (block of chain) {
                    if (!BLOCK_VALIDATOR.isBlockValid(block)) {
                        chainIsValid = false;
                        console.log('Chain revalidate block invalid ', block.name, block.height);
                        break;
                    }
                }

                if (chainIsValid) {
                    validatedChains.push(chain);
                }
            }

            return resolve(validatedChains);
        }.bind(this));
    }




}

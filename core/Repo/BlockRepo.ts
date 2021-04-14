import Storage, { DATA_REMOVE_VALUE } from "../Storage/Storage";
import Block, { BlockStatusType, BLOCK_STATUSES } from "../Block/Block";
import settings from '../../settings';
import { json, sha256x2, paddBlockHeight, getTimestampString } from "../tools";
import BlockFactory from "../Factory/BlockFactory";
import TransactionRepo from "./TransactionRepo";
import SettingsRepo from "./SettingsRepo";
import EventsManager from "../Events/EventManager";
import BlockValidator from "../Validator/BlockValidator";
import { MinedResult } from "../Service/MiningService";
import UtxoRepo from "./UtxoRepo";

const NAMESPACE = 'block';
const BLOCK_FACTORY = new BlockFactory;

export type ForkArray = Array<{ height: number, name: string }>
export type AddBlockOptions = {
    chainHeight: number,
    blockNamesForHeight: Array<String>,
    fork?: ForkArray,
};
export type BlockNamesForHeight = Array<string>;
export type ChainForks = Array<{
    height: number,
    blocks: Array<{
        name: string,
        prev: string,
        workDone: number,
    }>
}>;

export default class BlockRepo {
    storage: Storage;
    transactionRepo: TransactionRepo;
    settingsRepo: SettingsRepo;
    eventsManager: EventsManager;
    blockValidator: BlockValidator;
    utxoRepo: UtxoRepo;

    constructor(
        storage: Storage,
        transactionRepo: TransactionRepo,
        settingsRepo: SettingsRepo,
        eventsManager: EventsManager,
        blockValidator: BlockValidator,
        utxoRepo: UtxoRepo
    ) {
        this.storage = storage;
        this.transactionRepo = transactionRepo;
        this.settingsRepo = settingsRepo;
        this.eventsManager = eventsManager;
        this.blockValidator = blockValidator;
        this.utxoRepo = utxoRepo;
    }

    exists = (key: string): Promise<boolean> => {
        return this.storage.has(NAMESPACE, key);
    }

    getValueStringByKey = (key: string): Promise<string> => {
        return new Promise(function getValueStringByKeyPromise(this: BlockRepo, resolve: CallableFunction, reject: any) {
            this.storage.get(NAMESPACE, key).then(function getValueStringByKeyStorageFetch(result: string) {
                resolve(result);
            }).catch(reject);
        }.bind(this));
    }

    getValueIntegerByKey = (key: string): Promise<number> => {
        return new Promise(function getValueNumberByKeyPromise(this: BlockRepo, resolve: CallableFunction, reject: any) {
            this.storage.get(NAMESPACE, key).then(function getValueNumberByKeyStorageFetch(result: string) {
                resolve(parseInt(result));
            }).catch(reject);
        }.bind(this));
    }
    getBlockByName = (name: string): Promise<Block> => {
        return new Promise(function getBlockByNamePromise(this: BlockRepo, resolve: CallableFunction, reject: any) {
            this.storage.get(NAMESPACE, name).then(async function getBlockByNameStorageFetch(this: BlockRepo, result: string) {

                resolve(
                    BLOCK_FACTORY.createFromString(result)
                        .setStatus(await this.getBlockStatus(name))
                );

            }.bind(this)).catch(reject);
        }.bind(this));
    }

    getBlockHeight = (name: string): Promise<number> => {
        return this.getValueIntegerByKey(name + '.height');
    }

    getBlockNameByHeight = (height: number): Promise<string> => {
        console.error('DEPRECATED getBlockNameByHeight')
        // return this.getValueStringByKey('height.' + height);
    }

    getBlockTimestampByName = (name: string): Promise<string> => {
        return this.getValueStringByKey(name + '.timestamp');
    }

    getBlockStatus = (name: string): Promise<BlockStatusType> => {
        return this.getValueStringByKey(name + '.status');
    }

    getWorkDoneByName = (name: string): Promise<number> => {
        return new Promise(function getWorkDoneByNamePromise(this: BlockRepo, resolve: CallableFunction, reject: any) {
            this.storage.get(NAMESPACE, name + '.workdone').then(function getWorkDoneByNameStorageFetch(result: string) {
                resolve(parseFloat(result));
            }).catch(reject);
        }.bind(this));
    }

    getBlockTargetByName = (name: string): Promise<number> => {
        return new Promise(function getValueNumberByKeyPromise(this: BlockRepo, resolve: CallableFunction, reject: any) {
            this.storage.get(NAMESPACE, name + '.target').then(function getBlockTargetByNameStorageFetch(result: string) {
                resolve(result);
            }).catch(reject);
        }.bind(this));
    }

    getBlockByHeight = (height: number): Promise<Block> => {
        console.log('DEPRICATED getBlockByHeight')
        return new Promise(function getBlockByHeightPromise(this: BlockRepo, resolve: CallableFunction, reject: any) {
            this.storage.get(NAMESPACE, 'height.' + height).then(function getBlockNameByHeightStorageFetch(this: BlockRepo, blockName: string) {
                this.getBlockByName(blockName).then(function getBlockByHeightNameStorageFetch(block: Block) {
                    resolve(block);
                }).catch(reject);
            }.bind(this)).catch(reject);
        }.bind(this));
    }

    async getPrevBlockNameByName(name: string): Promise<string> {
        return await this.storage.get(NAMESPACE, name + '.prevBlockName');
    }

    async getNextBlockNameByName(name: string): Promise<string> {
        return await this.storage.get(NAMESPACE, name + '.nextBlockName');
    }

    getBlocksNamesForHeight = (height: number): Promise<BlockNamesForHeight> => {
        return new Promise(function getBlocksNamesForHeightPromise(this: BlockRepo, resolve: CallableFunction, reject: any) {
            this.storage.get(NAMESPACE, 'blocks.height.' + height).then(function getBlocksNamesForHeightFetch(blocksNames: string) {
                resolve(blocksNames.length ? blocksNames.split(',') : []);
            }).catch(reject);
        }.bind(this));
    }

    loadFullBlock = (block: Block): Promise<Block> => {
        return new Promise(async function loadFullBlockPrimise(this: BlockRepo, resolve: CallableFunction, reject: any) {
            try {
                block.transactions = [];
                for (let i in block.transactionsNames) {
                    block.transactions.push(await this.transactionRepo.getTransactionByName(block.transactionsNames[i]));
                    block.transactions[i].block = block;
                }
                resolve(block);
            } catch (error) {
                reject(error);
            }

        }.bind(this));
    }

    // populateUtxos = (block: Block): Promise<Block> => {
    //     return new Promise(async function populateUtxosPrimise(this: BlockRepo, resolve: CallableFunction, reject: any) {
    //         try {
    //             for (let i in block.transactions) {
    //                 if (!block.transactions[i].isCoinbase()) {
    //                     block.transactions[i] = await this.utxoRepo.populateTransaction(block.transactions[i]);
    //                 }
    //             }
    //             resolve(block);
    //         } catch (error) {
    //             reject(error);
    //         }
    //     }.bind(this));
    // }

    /**
     * Checks for block orphan logic
     */
    // validateAndAddBlock = (block: Block, minedResult: MinedResult): Promise<boolean> => {
    //     return new Promise(async function validateAndAddBlockPrimise(this: BlockRepo, resolve: CallableFunction, reject: any) {
    //         block.timestamp = getTimestampString();

    //         console.log('+ ' + block.height + ' ' + block.name);

    //         const options: AddBlockOptions = {
    //             blockNamesForHeight: [],
    //             chainHeight: 0,
    //         };
    //         // console.log('Adding new block ' + block.height)
    //         // console.log('validateAndAddBlock ' + block.name);
    //         block.workDone = minedResult.workDone;

    //         // skip early, if block is not valid, reject it
    //         // if (false === this.blockValidator.isBlockValid(block)) {
    //         //     console.log('validateAndAddBlock: blockValidator : invalid block');
    //         //     return resolve(false);
    //         // }

    //         // if (block.height > 1 && false === await this.exists(block.prevBlockName)) {
    //         //     console.log('Prev block does not exists');
    //         //     return resolve(false);
    //         // }

    //         if (await this.exists(block.name)) {
    //             console.log('Block already exists, skipping add');
    //             return resolve(false);
    //         }

    //         const prevHeightBlockName = await this.getBlockNameByHeight(block.height - 1);

    //         // forking
    //         if (prevHeightBlockName !== block.prevBlockName) {
    //             // check if block exists in side chain
    //             if ((await this.getBlocksNamesForHeight(block.height - 1)).indexOf(block.prevBlockName) === -1) {
    //                 console.log('Block does not exists in sidechain');
    //                 return resolve(false);
    //             }
    //             console.log('Calcualting longest chain');
    //             console.log('Prev block name ' + block.prevBlockName);

    //             let mainChainWorkDone: number = 0;
    //             let forkChainWorkDone: number = block.workDone;

    //             let mainChainName: string = '';
    //             let forkChainName: string = block.name;

    //             let mainChainPrevName: string = '';
    //             let forkChainPrevName: string = block.prevBlockName;

    //             let height: number = await this.settingsRepo.getLastBlockHeight();
    //             const fork: ForkArray = [
    //                 {
    //                     height: block.height - 1,
    //                     name: forkChainPrevName,
    //                 }
    //             ];

    //             console.log('Claulate chain ', block.height, block.name);

    //             while (true) {
    //                 console.log(height)
    //                 mainChainName = await this.getBlockNameByHeight(height);
    //                 mainChainPrevName = await this.getPrevBlockNameByName(mainChainName);
    //                 mainChainWorkDone += await this.getWorkDoneByName(mainChainName);

    //                 if (height === block.height) {
    //                     forkChainName = block.name;
    //                     forkChainPrevName = block.prevBlockName;
    //                     forkChainWorkDone = block.workDone;
    //                 } else if (height < block.height) {
    //                     forkChainName = forkChainPrevName;
    //                     forkChainPrevName = await this.getPrevBlockNameByName(forkChainName);
    //                     forkChainWorkDone += await this.getWorkDoneByName(forkChainName);
    //                     fork.push({
    //                         height: height - 1,
    //                         name: forkChainPrevName,
    //                     });
    //                 }
    //                 if (mainChainPrevName === forkChainPrevName) {
    //                     break;
    //                 }
    //                 height--;
    //             }

    //             if (mainChainWorkDone < forkChainWorkDone) {
    //                 options.fork = fork;
    //                 return resolve(await this.addBlock(block, options));
    //             }
    //         }

    //         block = await this.populateUtxos(block);
    //         if (this.blockValidator.isBlockValid(block)) {
    //             return resolve(await this.addBlock(block, options));
    //         }
    //         return resolve(false);


    //     }.bind(this));
    // }

    // addBlock = (block: Block, options: AddBlockOptions): Promise<boolean> => {
    //     return new Promise(async function laddBlockPrimise(this: BlockRepo, resolve: CallableFunction, reject: any) {

    //         this.persist(block, options).then(function addBlockPersisted(this: BlockRepo, added: boolean) {
    //             return resolve(added);
    //         }.bind(this)).catch((error) => {
    //             console.error(error);
    //             return resolve(false);
    //         });
    //     }.bind(this));
    // }

    // persist = (block: Block, options: AddBlockOptions): Promise<boolean> => {
    //     return new Promise(function persistPromise(this: BlockRepo, resolve: CallableFunction, reject: any) {
    //         this.getBlocksNamesForHeight(block.height).then(async function getBlocksNamesForHeightFetched(this: BlockRepo, blockNamesForHeight: Array<String>) {
    //             options.blockNamesForHeight = blockNamesForHeight;

    //             return resolve(await this.persistWithOptions(block, options));
    //         }.bind(this)).catch(reject);
    //     }.bind(this));
    // }

    /**
     *  Storing a block does not guarantee being in chain (yet)
     * @param block 
     * @returns 
     */
    addBlock = (block: Block): Promise<boolean> => {
        return new Promise(async function persistWithHeightNamesPromise(this: BlockRepo, resolve: CallableFunction, reject: any) {

            let data = [];

            // if (options.blockNamesForHeight.indexOf(block.name) === -1) {
            //     options.blockNamesForHeight.push(block.name);
            //     data.push({
            //         namespace: 'block',
            //         key: 'blocks.height.' + block.height,
            //         value: options.blockNamesForHeight.join(','),
            //     });
            // }

            data.push({
                namespace: 'block',
                key: block.name,
                value: {
                    name: block.name,
                    height: block.height,
                    weight: block.weight,
                    chainWeight: block.chainWeight,
                    target: block.target,
                    nonce: block.nonce,
                    hash: block.hash,
                    prevBlockName: block.prevBlockName,
                    timestamp: block.timestamp,
                    transactionsNames: [],
                }
            });
            const blockKey = data.length - 1;

            if (block.height > 1) {
                data.push({
                    namespace: 'block',
                    key: block.name + '.prevBlockName',
                    value: block.prevBlockName,
                });
                data.push({
                    namespace: 'block',
                    key: block.prevBlockName + '.nextBlockName',
                    value: block.name,
                });
            }

            data.push({
                namespace: 'block',
                key: block.name + '.chainWeight',
                value: block.chainWeight,
            });

            data.push({
                namespace: 'block',
                key: block.name + '.height',
                value: block.height,
            });

            data.push({
                namespace: 'block',
                key: block.name + '.status',
                value: block.status,
            });

            data.push({
                namespace: 'block',
                key: block.name + '.target',
                value: block.target,
            });

            data.push({
                namespace: 'block',
                key: block.name + '.timestamp',
                value: block.timestamp,
            });

            // data.push({
            //     namespace: 'block',
            //     key: 'height.' + block.height,
            //     value: block.name,
            // });

            let tmp: any;
            for (let t: number = 0; t <= block.transactions.length - 1; t++) {
                data[blockKey]['value']['transactionsNames'].push(block.transactions[t].name);

                if (!block.transactions[t].isCoinbase()) {
                    data.push({
                        namespace: 'pool',
                        key: block.transactions[t].name,
                        value: DATA_REMOVE_VALUE,
                    });
                }

                tmp = {
                    name: block.transactions[t].name,
                    num: block.transactions[t].num,
                    blockName: block.name,
                    inputs: [],
                    outputs: [],
                };


                for (let i: number = 0; i <= block.transactions[t].inputs.length - 1; i++) {
                    tmp.inputs.push({
                        num: block.transactions[t].inputs[i].num,
                        outputNum: block.transactions[t].inputs[i].outputNum,
                        transactionName: block.transactions[t].inputs[i].transactionName,
                        script: block.transactions[t].inputs[i].script
                    });

                    if (block.transactions[t].inputs[i].utxo) {
                        data.push({
                            namespace: 'utxo',
                            key: 'output.' + block.transactions[t].inputs[i].utxo?.transactionName + '.' + block.transactions[t].inputs[i].utxo?.outputNum,
                            value: DATA_REMOVE_VALUE,
                        });
                    }
                }

                for (let o: number = 0; o <= block.transactions[t].outputs.length - 1; o++) {
                    tmp.outputs.push({
                        num: block.transactions[t].outputs[o].num,
                        value: block.transactions[t].outputs[o].value,
                        script: block.transactions[t].outputs[o].script
                    });

                    // populate utxo
                    data.push({
                        namespace: 'utxo',
                        key: 'output.' + block.transactions[t].name + '.' + block.transactions[t].outputs[o].num,
                        value: {
                            blockHeight: block.height,
                            transactionName: block.transactions[t].name,
                            transactionNum: block.transactions[t].num,
                            outputNum: block.transactions[t].outputs[o].num,
                            value: block.transactions[t].outputs[o].value,
                            script: block.transactions[t].outputs[o].script,
                            // @TODO may not be needed
                            hashedAddress: sha256x2(block.transactions[t].outputs[o].getScriptAddress()),
                        },
                    });
                }

                data.push({
                    namespace: 'transaction',
                    key: block.transactions[t].name,
                    value: tmp,
                });
            }

            // if (block.height > options.chainHeight || options.fork) {
            //     data.push({
            //         namespace: 'setting',
            //         key: settings.LAST_BLOCK_HEIGHT_KEY,
            //         value: block.height,
            //     });

            //     data.push({
            //         namespace: 'setting',
            //         key: settings.LAST_BLOCK_NAME_KEY,
            //         value: block.name,
            //     });
            // }

            // if (options.fork) {
            //     for (let f in options.fork) {
            //         data.push({
            //             namespace: 'block',
            //             key: 'height.' + options.fork[f].height,
            //             value: options.fork[f].name,
            //         });
            //         console.log('Update ' + 'height.' + options.fork[f].height + ' with ' + options.fork[f].name)
            //     }
            // }

            this.storage.puts(data).then(async function blockPersistedSucces(this: BlockRepo) {
                console.log('Block in storage ', block.height, block.name)
                resolve(true);
            }.bind(this)).catch(function blockPersistedFail(error) {
                console.error(error);
                resolve(false);

            });
        }.bind(this));
    }

    updateStatus = (blockName: string, status: BlockStatusType) => {
        return this.storage.put(NAMESPACE, blockName + '.status', status);
    }
}

import Storage, { DATA_REMOVE_VALUE } from "../Storage/Storage";
import Block from "../Block/Block";
import settings from '../../settings';
import { json, sha256x2, paddBlockHeight } from "../tools";
import BlockFactory from "../Factory/BlockFactory";
import TransactionRepo from "./TransactionRepo";

const NAMESPACE = 'block';
const BLOCK_FACTORY = new BlockFactory;

export default class BlockRepo {
    storage: Storage;
    transactionRepo: TransactionRepo;

    constructor(storage: Storage, transactionRepo: TransactionRepo) {
        this.storage = storage;
        this.transactionRepo = transactionRepo;
    }

    getValueStringByKey = (key: string) : Promise<string> =>  {
        return new Promise(function getValueStringByKeyPromise(this: BlockRepo, resolve: CallableFunction, reject: any) {
            this.storage.get(NAMESPACE, key).then(function getValueStringByKeyStorageFetch(result: string) {
                resolve(result);
            }).catch(reject);
        }.bind(this));
    }
    
    getValueIntegerByKey = (key: string) : Promise<number> =>  {
        return new Promise(function getValueNumberByKeyPromise(this: BlockRepo, resolve: CallableFunction, reject: any) {
            this.storage.get(NAMESPACE, key).then(function getValueNumberByKeyStorageFetch(result: string) {
                resolve(parseInt(result));
            }).catch(reject);
        }.bind(this));
    }
    getBlockByName = (name: string): Promise<Block> => {
        return new Promise(function getBlockByNamePromise(this: BlockRepo, resolve: CallableFunction, reject: any) {
            this.storage.get(NAMESPACE, name).then(function getBlockByNameStorageFetch(result: string) {
                resolve(BLOCK_FACTORY.createFromString(result));
            }).catch(reject);
        }.bind(this));
    }

    getBlockNameByHeight = (height: number): Promise<string> => {
        return this.getValueStringByKey('height.' + height);
    }

    getBlockTimestampByName = (name: string): Promise<string> => {
        return this.getValueStringByKey(name + '.timestamp');
    }

    getBlockDifficultyByName = (name: string): Promise<number> => {
        return this.getValueIntegerByKey(name + '.difficulty');
    }

    getBlockByHeight = (height: number): Promise<Block> => {
        return new Promise(function getBlockByHeightPromise(this: BlockRepo, resolve: CallableFunction, reject: any) {
            this.storage.get(NAMESPACE, 'height.' + height).then(function getBlockNameByHeightStorageFetch(this: BlockRepo, blockName: string) {
                this.getBlockByName(blockName).then(function getBlockByHeightNameStorageFetch(block: Block) {
                    resolve(block);
                }).catch(reject);
            }.bind(this)).catch(reject);
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


    persist = (block: Block): Promise<CallableFunction> => {
        let data = [];

        data.push({
            namespace: 'block',
            key: block.name,
            value: {
                name: block.name,
                height: block.height,
                weight: block.weight,
                chainWeigt: block.chainWeight,
                difficulty: block.difficulty,
                nonce: block.nonce,
                prevBlockName: block.prevBlockName,
                timestamp: block.timestamp,
                transactionsNames: [],
            }
        });

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
            key: block.name + '.difficulty',
            value: block.difficulty,
        });

        data.push({
            namespace: 'block',
            key: block.name + '.timestamp',
            value: block.timestamp,
        });

        data.push({
            namespace: 'block',
            key: 'height.' + block.height,
            value: block.name,
        });

        let tmp: any;

        for (let t: number = 0; t <= block.transactions.length - 1; t++) {
            data[0]['value']['transactionsNames'].push(block.transactions[t].name);

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

        data.push({
            namespace: 'setting',
            key: settings.LAST_BLOCK_HEIGHT_KEY,
            value: block.height,
        });

        data.push({
            namespace: 'setting',
            key: settings.LAST_BLOCK_NAME_KEY,
            value: block.name,
        });

        return this.storage.puts(data);
    }
}

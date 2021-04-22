import Storage from "../Storage/Storage";
import Block, { BlockConstructor, BLOCK_STATUS_INVALID, BLOCK_STATUS_MINED } from "../Block/Block";
import settings from '../../settings';
import SettingsRepo from '../Repo/SettingsRepo';
import BlockModel from "../Block/BlockModel";
import Address from "../Address/Address";
import BlockRepo from "../Repo/BlockRepo";
import PoolRepo from "../Repo/PoolRepo";
import BlockValidator from "../Validator/BlockValidator";
import { sha256x2, getSecondsBetweenDates, unixTime } from "../tools";
import { IncomingMessage, ServerResponse } from "http";
import { BLOCK_FACTORY, address1, TMP_MINING_ADDRESS, getRandomTestAddress, POOL_ITEM_FACTORY } from "../../globals";
import { isNumber } from "util";
import QueueService from "./QueueService";
import Queue, { QUEUE_TYPE_BLOCK, QUEUE_TYPE_SYNC } from "../Block/Queue";
import Peers, { PeerConstructor } from "../Block/Peers";
import MiningService, { MineResult } from "./MiningService";
const bcrypt = require('bcrypt');
const http = require('http');
const querystring = require('querystring');
import axios from 'axios';
import EventsManager from "../Events/EventManager";
import ChainRepo from "../Repo/ChainRepo";
import { resolve } from "path";
import PoolItem from "../Block/PoolItem";
import ClientTestDataSeeder from '../../tests/ClientTestDataSeeder';

export type SyncTarget = { height: number, peer: PeerConstructor };

export default class ClientService {
    settingsRepo: SettingsRepo;
    blockModel: BlockModel;
    blockRepo: BlockRepo;
    poolRepo: PoolRepo;
    blockValidator: BlockValidator;
    queueService: QueueService;
    miningService: MiningService;
    eventsManager: EventsManager;
    chainRepo: ChainRepo;

    peers: Peers;

    private hasFullSync: boolean = false;

    constructor(
        settingsRepo: SettingsRepo,
        blockModel: BlockModel,
        blockRepo: BlockRepo,
        poolRepo: PoolRepo,
        blockValidator: BlockValidator,
        queueService: QueueService,
        miningService: MiningService,
        eventsManager: EventsManager,
        chainRepo: ChainRepo
    ) {
        this.settingsRepo = settingsRepo;
        this.blockModel = blockModel;
        this.blockRepo = blockRepo;
        this.poolRepo = poolRepo;
        this.blockValidator = blockValidator;
        this.queueService = queueService;
        this.miningService = miningService;
        this.eventsManager = eventsManager;
        this.chainRepo = chainRepo;
        this.peers = new Peers([]);

        this.eventsManager.on('EVENT_POOL_ITEMS_ADDED', this.populatePoolItems);
    }

    isSynced(): boolean {
        return this.hasFullSync;
    }

    /**
     * Thinkgs to do 
     * 1. Sync the node
     * 2. check for new blocks
     * 3. Mine
     */
    start = (): boolean => {
        // @TODO peers management

        // @TODO for tests only
        console.log('Data seeder started')
        const seeder = new ClientTestDataSeeder;
        seeder.start();

        this.settingsRepo.getPeers().then(function setPeers(this: ClientService, peers: Peers) {
            console.log('Peers loaded', peers.getAll())
            this.hasFullSync = true;
            this.peers = peers;

            // @TODO uncomment
            this.ensureSync().then(function clientSynced(this: ClientService) {
                console.log('------Client synced--------');

                console.log('------Start periodic pull------');
                this.startPeriodicBlockPull();
                // console.log('------Start block process------');
                // this.startBlockQueueProcess();
                console.log('------Mining started--------');
                this.startMining();


                //     // @TODO mining adter sync ?


            }.bind(this));
            console.log('asfasf')
            // this.startMining();

        }.bind(this));

        // this.startMining();



        return true;
    }

    startPeriodicBlockPull = () => {
        let processing: boolean = false;
        let cleintHeight: number;
        let blocks: Array<Block> | undefined;

        setInterval(async function periodicBlockPull(this: ClientService) {
            if (processing) {
                return false;
            }
            processing = true;

            cleintHeight = await this.settingsRepo.getLastBlockHeight();
            // console.log('REQUESTING BLOCK ' +( cleintHeight + 1))
            blocks = await this.getBlocks(cleintHeight + 1);
            if (blocks) {
                await this.chainRepo.addBlocks(blocks.map(block => block.setStatus(BLOCK_STATUS_INVALID)));
            }

            processing = false;
            return true;
        }.bind(this), settings.TARGET_BLOKC_TIME_SEC * 1000 / 2);
    }

    startMining = () => {
        (function miner(this: ClientService) {
            let block: Block;
            let added: bool = false;
            const minerLoop = async function (this: ClientService) {
                if (await this.settingsRepo.getSetting(settings.MINING_ENABLED_KEY) !== 'yes') {
                    return false;
                }

                console.log('Mining started')
                /**
                 * @TODO Fix address
                 */
                const tmpAddress = getRandomTestAddress();
                block = await this.miningService.createNextBlock(tmpAddress);
                if (!this.blockValidator.isBlockValid(block)) {
                    console.log(block);
                    console.log('block invalid');
                    process.exit();
                }

                console.log('Block candidate ', block.height, block.name)
                this.miningService.mine(block, tmpAddress).then(async function blockMinedSuccess(this: ClientService, resultResult: MineResult) {
                    // if (block.height <= await this.settingsRepo.getLastBlockHeight()) {
                    //     return minerLoop();
                    // }
                    block.status = BLOCK_STATUS_MINED;
                    block.target = resultResult['target'];
                    block.nonce = resultResult['nonce'];
                    block.hash = resultResult['hash'];
                    block.weight = resultResult['weight'];
                    block.chainWeight += block.weight;
                    console.log('Block mined, pushing to chain', block.height, block.name)

                    added = await this.chainRepo.addBlock(block);
                    console.log('Block persisted ', added)
                    if (added) {
                        this.propagateBlock(block);
                    }

                    setTimeout(minerLoop, 1);

                    return true;
                }.bind(this)).catch(function blockMinedFail() {
                    setTimeout(minerLoop, 1);
                });
            }.bind(this);

            setTimeout(minerLoop, 1);
        }.bind(this))();
    }

    ensureSync = () => {
        return new Promise(async function ensureSyncPromise(this: ClientService, resolve: CallableFunction, reject: any) {
            let synced: boolean = true;
            // 
            console.log('ensure sync')

            while (synced) {
                synced = await this.sync();
            }

            return resolve(true);
        }.bind(this));
    }

    /**
     * @TODO 3 nodes in pair, one is ahaed, how to sync ?
     * @TODO side chain sync back
     */
    sync = (): Promise<boolean> => {
        // console.log('Syncing')
        return new Promise(async function syncPromise(this: ClientService, resolve: CallableFunction, reject: any) {

            let newtworkTarget: SyncTarget | undefined = await this.ensureSyncTarget();
            console.log('network target resolved to ', newtworkTarget)
            if (!newtworkTarget) {
                // if not network target found, skip the sync
                return resolve(false);
            }

            let cleintHeight = await this.settingsRepo.getLastBlockHeight();
            if (cleintHeight >= newtworkTarget.height) {
                return resolve(false);
            }

            let blocks: Array<Block> | undefined;
            // sync it
            while (cleintHeight < newtworkTarget.height) {
                console.log(cleintHeight)
                console.log('Request block ', cleintHeight + 1)
                blocks = await this.getBlocksFromPeer(newtworkTarget.peer, cleintHeight + 1);
                if (blocks) {
                    console.log(blocks[0].transactions[1]);
                    let debug = await this.chainRepo.addBlocks(blocks.map(block => block.setStatus(BLOCK_STATUS_INVALID)));
                    console.log('blocks added', debug)
                    cleintHeight = await this.settingsRepo.getLastBlockHeight();

                }
            }
            return resolve(true);
        }.bind(this));
    }

    ensureSyncTarget = (): Promise<SyncTarget | undefined> => {
        return new Promise(async function ensureSyncTargetPromise(this: ClientService, resolve: CallableFunction, reject: any) {
            let newtworkTarget: SyncTarget | undefined;
            let timeout = false;
            setTimeout(() => timeout = true, 10 * 1000);
            while (true) {
                newtworkTarget = await this.getSyncTarget();
                // console.log('network target', newtworkTarget, timeout)
                if (newtworkTarget || timeout) {
                    break;
                }
            }
            return resolve(newtworkTarget);
        }.bind(this));
    }

    getSyncTarget = (): Promise<SyncTarget | undefined> => {
        return new Promise(async function getSyncTargetPromise(this: ClientService, resolve: CallableFunction, reject: any) {

            const promises: Array<Promise<boolean>> = [];
            let targetHeight = 0;
            let targetPeer: PeerConstructor;
            let queried = 0;
            this.peers.get(10).forEach(function foreachPeer(this: ClientService, peer: PeerConstructor) {
                promises.push(new Promise((resolve: CallableFunction, reject: any) => {
                    this.request(peer, { action: 'getChainHeight' }).then((object: Object) => {
                        const chaninHeight = parseInt(object['chainHeight'] || 0);
                        if (chaninHeight > targetHeight) {
                            targetHeight = chaninHeight;
                            targetPeer = peer;
                        }
                        queried++;
                        resolve(true);
                    }).catch(() => {
                        resolve(true);
                    });
                }));
            }.bind(this));

            Promise.all(promises).then(() => {
                resolve(queried > 0 ? { height: targetHeight, peer: targetPeer } : undefined);
            }).catch(() => {
                resolve(queried > 0 ? { height: targetHeight, peer: targetPeer } : undefined);
            });
        }.bind(this));
    }

    getBlocks = (height: number): Promise<Array<Block> | undefined> => {
        return this.getBlocksFromPeer(this.peers.getOne(), height);
    }

    getBlocksFromPeer = (peer: PeerConstructor, height: number): Promise<Array<Block> | undefined> => {
        return new Promise(function getBlockPromise(this: ClientService, resolve: CallableFunction, reject: any) {
            this.request(peer, { action: 'getBlocks', height }).then(function getBlockRequest(data: { blocks: Array<BlockConstructor> }) {
                if (undefined !== data['blocks']) {
                    resolve(data['blocks'].map(blockData => BLOCK_FACTORY.createFromObject(blockData)));
                } else {
                    return resolve(undefined);
                }
            }).catch(function getBlockError() {
                return resolve(undefined);
            });
        }.bind(this));
    }

    propagateBlock = (block: Block, callback?: CallableFunction) => {
        return this.propagate(
            { action: 'propagateBlock' },
            { block: BLOCK_FACTORY.createArrayFromObject(block) },
            callback
        );
    }

    populatePoolItems = (poolItemsData: Array<any>) => {
        // @TODO may be queue it ?
        // console.log('Propagate poolitem')
        let poolItemData: any;
        for (poolItemData of poolItemsData) {
            this.propagate(
                { action: 'propagatePoolItem' },
                { poolItem: poolItemData }
            );
        }
    }

    /**
     * @TODO refactor with Promise.all
     * 
     * @param query
     * @param data 
     * @param callback 
     * @returns 
     */
    propagate = (query: { action: string }, data: Object, callback?: CallableFunction): Promise<boolean> => {
        return new Promise(function propagatePromise(this: ClientService, resolve: CallableFunction, reject: any) {
            const peers = this.peers.getAll();
            const size = peers.length;
            // console.log(size)
            let connections: number = 0;
            let done: number = 0;
            let peer: PeerConstructor | undefined;
            let interval: any;
            let callbackDone: boolean = false;

            interval = setInterval(function propagateInterval(this: ClientService) {
                // console.log(done + '>' + size);
                if (done >= size) {
                    clearInterval(interval);
                    return resolve(true);

                }
                if (connections >= settings.MAX_PROPAGET_PEERS_COUNT) {
                    return;
                }
                peer = peers.pop();
                if (peer) {
                    connections++;
                    this.request(peer, query, data).then(function propagateRequestDone() {
                        // console.log('== Block Propagated ' + data.block.height)
                        connections--;
                        done++;
                        if (!callbackDone) {
                            callbackDone = true;
                            if (callback) {
                                callback();
                            }
                        }
                    }).catch(function propagateRequestError() {
                        // console.log('propagateRequestError')
                        connections--;
                        done++;
                    });
                }
            }.bind(this), 50);

        }.bind(this));
    }

    requestBest = (query: { action: string }, data?: {}): Promise<Object> => {
        return new Promise(function requestPromise(this: ClientService, resolve: CallableFunction, reject: any) {
            this.request(this.peers.getOne(), query, data).then(resolve).catch(reject);
        }.bind(this));
    }

    request = (peer: PeerConstructor, query: { action: string }, data?: {}): Promise<Object> => {
        return new Promise(function requestPromise(this: ClientService, resolve: CallableFunction, reject: any) {
            // console.log('Request ' + 'http://' + peer.ip + ':' + peer.port + '?' + querystring.stringify(query))
            axios({
                method: data ? 'post' : 'get',
                url: 'http://' + peer.ip + ':' + peer.port + '?' + querystring.stringify(query),
                data: data,
                headers: {
                    'Content-Type': 'application/json',
                },
            }).then(function requestReponse(response: { data?: Object }) {
                // console.log(response.data)
                resolve(response.data || {});
            }, function requestError(error) {
                // console.log(error);
                // process.exit();
                reject(error);
            });
        }.bind(this));
    }
}

import Storage from "../Storage/Storage";
import Block, { BlockConstructor } from "../Block/Block";
import settings from '../../settings';
import SettingsRepo from '../Repo/SettingsRepo';
import BlockModel from "../Block/BlockModel";
import Address from "../Address/Address";
import BlockRepo from "../Repo/BlockRepo";
import PoolRepo from "../Repo/PoolRepo";
import BlockValidator from "../Validator/BlockValidator";
import { sha256x2, getSecondsBetweenDates, unixTime } from "../tools";
import { IncomingMessage, ServerResponse } from "http";
import { BLOCK_FACTORY, address1, TMP_MINING_ADDRESS } from "../../globals";
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

    peers: Peers;

    blocksToPersists: Array<{ block: Block, callback?: CallableFunction }> = [];

    private hasFullSync: boolean = false;
    private lastBlocKAddedTime: number = 0;

    constructor(
        settingsRepo: SettingsRepo,
        blockModel: BlockModel,
        blockRepo: BlockRepo,
        poolRepo: PoolRepo,
        blockValidator: BlockValidator,
        queueService: QueueService,
        miningService: MiningService,
        eventsManager: EventsManager
    ) {
        this.settingsRepo = settingsRepo;
        this.blockModel = blockModel;
        this.blockRepo = blockRepo;
        this.poolRepo = poolRepo;
        this.blockValidator = blockValidator;
        this.queueService = queueService;
        this.miningService = miningService;
        this.eventsManager = eventsManager;

        this.eventsManager.on('blockAdded', function blockAddedEventCallback(this: ClientService, _: Block) {
            this.lastBlocKAddedTime = unixTime();

        }.bind(this));
    }

    isSynced(): boolean {
        return this.hasFullSync;
    }

    /**
     * Thinkgs to do 
     * 1. Sync the node
     * 2. Mine
     */
    start = (): boolean => {
        this.settingsRepo.getPeers().then(function setPeers(this: ClientService, peers: Peers) {
            this.hasFullSync = true;
            this.peers = peers;

            this.ensureSync().then(function clientSynced(this: ClientService) {
                console.log('------Client synced--------');
                this.lastBlocKAddedTime = unixTime();

                // console.log('------Start periodic pull------');
                // this.startPeriodicBlockPull();
                console.log('------Start block process------');
                this.startBlockQueueProcess();
                console.log('------Mining started--------');
                this.startMining();

            }.bind(this));


        }.bind(this));

        return true;
    }

    pushBlockToQueue = (block: Block, callback?: CallableFunction) => {
        if (!this.blocksToPersists.filter(pair => pair.block.name === block.name).length) {
            // console.log('Push to queue ' + block.name)
            this.blocksToPersists.push({ block, callback });
        }
    }

    startBlockQueueProcess = () => {
        const blockProcessLoopTimeout = 10;
        let pair: { block: Block, callback?: CallableFunction } | undefined;
        let blockProcessLoop: CallableFunction;
        blockProcessLoop = async function (this: ClientService) {
            pair = this.blocksToPersists.pop();
            if (pair) {
                this.blockRepo.validateAndAddBlock(
                    pair.block,
                    await this.miningService.getMinedResult(pair.block)
                ).then(function validateAndAddBlockSuccess(added: boolean) {
                    // console.log('Block added ' + added)
                    setTimeout(blockProcessLoop, blockProcessLoopTimeout);
                    if (pair && pair.callback) {
                        pair.callback(added);
                    }
                    // console.log('startBlockQueueProcess PROCESSING ENDED')
                }).catch(function validateAndAddBlockFail() {
                    setTimeout(blockProcessLoop, blockProcessLoopTimeout);
                });
            } else {
                setTimeout(blockProcessLoop, blockProcessLoopTimeout);
            }
            return true;
        }.bind(this);
        blockProcessLoop();
    }

    startPeriodicBlockPull = () => {
        let processing: boolean = false;
        let cleintHeight: number;
        let block: Block | undefined;

        setInterval(async function periodicBlockPull(this: ClientService) {
            if (processing || this.lastBlocKAddedTime + settings.TARGET_BLOKC_TIME_SEC * 4 > unixTime()) {
                return false;
            }
            processing = true;

            cleintHeight = await this.settingsRepo.getLastBlockHeight();
            // console.log('REQUESTING BLOCK ' +( cleintHeight + 1))
            block = await this.getBlock(cleintHeight + 1);
            if (block) {
                this.pushBlockToQueue(block);
            }

            processing = false;
            return true;
        }.bind(this), settings.TARGET_BLOKC_TIME_SEC * 1000);
    }

    startMining = () => {
        (function miner(this: ClientService) {
            let block: Block;
            const minerLoop = async function (this: ClientService) {
                if (await this.settingsRepo.getSetting(settings.MINING_ENABLED_KEY) !== 'yes') {
                    return false;
                }
                /**
                 * @TODO Fix address
                 */
                block = await this.miningService.createNextBlock(TMP_MINING_ADDRESS);
                this.miningService.mine(block).then(async function blockMinedSuccess(this: ClientService, resultResult: MineResult) {
                    // if (block.height <= await this.settingsRepo.getLastBlockHeight()) {
                    //     return minerLoop();
                    // }

                    block.target = resultResult['target'];
                    block.nonce = resultResult['nonce'];

                    this.pushBlockToQueue(block, (added: boolean) => {
                        if (added) {
                            // console.log('Mined ' + block.height + ' target ' + block.target);
                            this.propagateBlock(block, function propagateToAtLeastOne() {
                                minerLoop();
                            });
                        }
                    });
                    return true;
                }.bind(this)).catch(function blockMinedFail() {
                    minerLoop();
                });
            }.bind(this);

            minerLoop();
        }.bind(this))();
    }

    ensureSync = () => {
        return new Promise(async function ensureSyncPromise(this: ClientService, resolve: CallableFunction, reject: any) {
            let synced: number = 1;
            while (synced > 0) {
                synced = await this.sync();
            }
            return resolve(true);
        }.bind(this));
    }

    /**
     * @TODO 3 nodes in pair, one is ahaed, how to sync ?
     */
    sync = (): Promise<number> => {
        // console.log('Syncing')
        return new Promise(async function syncPromise(this: ClientService, resolve: CallableFunction, reject: any) {

            let newtworkTarget: SyncTarget = await this.ensureSyncTarget();
            if (newtworkTarget.height <= 1) {
                return resolve(0);
            }
            console.log('Newtwork target ' + newtworkTarget.height);
            let cleintHeight = await this.settingsRepo.getLastBlockHeight();
            if (cleintHeight >= newtworkTarget.height) {
                return resolve(0);
            }

            let block: Block | undefined;
            let blockPersisted: boolean;
            let blocksSyncked: number = 0;

            // sync it
            while (cleintHeight < newtworkTarget.height) {
                block = await this.getBlockFromPeer(newtworkTarget.peer, cleintHeight + 1);
                if (block) {
                    blockPersisted = await this.blockRepo.validateAndAddBlock(
                        block,
                        await this.miningService.getMinedResult(block)
                    );
                    if (blockPersisted) {
                        blocksSyncked++;
                        cleintHeight++;
                    }
                }
            }
            return resolve(blocksSyncked);
        }.bind(this));
    }

    ensureSyncTarget = (): Promise<SyncTarget> => {
        return new Promise(async function ensureSyncTargetPromise(this: ClientService, resolve: CallableFunction, reject: any) {
            let newtworkTarget: SyncTarget | false = false;
            while (true) {
                newtworkTarget = await this.getSyncTarget();
                if (newtworkTarget !== false) {
                    break;
                }
            }
            return resolve(newtworkTarget);
        }.bind(this));
    }

    getSyncTarget = (): Promise<SyncTarget | false> => {
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
                resolve(queried > 0 ? { height: targetHeight, peer: targetPeer } : false);
            }).catch(() => {
                resolve(queried > 0 ? { height: targetHeight, peer: targetPeer } : false);
            });
        }.bind(this));
    }

    getBlock = (height: number): Promise<Block | undefined> => {
        return this.getBlockFromPeer(this.peers.getOne(), height);
    }

    getBlockFromPeer = (peer: PeerConstructor, height: number): Promise<Block | undefined> => {
        return new Promise(function getBlockPromise(this: ClientService, resolve: CallableFunction, reject: any) {
            this.request(peer, { action: 'getBlock', height }).then(function getBlockRequest(data: BlockConstructor) {
                if (undefined !== data['height'] && data['height'] === height) {
                    return resolve(BLOCK_FACTORY.createFromObject(data));
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
            axios({
                method: data ? 'post' : 'get',
                url: 'http://' + peer.ip + ':' + peer.port + '?' + querystring.stringify(query),
                data: data,
                headers: {
                    'Content-Type': 'application/json',
                },
            }).then(function requestReponse(response: { data?: Object }) {
                resolve(response.data || {});
            }, function requestError(error) {
                reject(error);
            });
        }.bind(this));
    }
}

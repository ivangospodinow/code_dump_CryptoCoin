import Storage from "../Storage/Storage";
import Block from "../Block/Block";
import settings from '../../settings';
import SettingsRepo from '../Repo/SettingsRepo';
import BlockModel from "../Block/BlockModel";
import Address from "../Address/Address";
import BlockRepo from "../Repo/BlockRepo";
import PoolRepo from "../Repo/PoolRepo";
import BlockValidator from "../Validator/BlockValidator";
import { sha256x2 } from "../tools";
import { IncomingMessage, ServerResponse } from "http";
import { BLOCK_FACTORY, address1 } from "../../globals";
import { isNumber } from "util";
import QueueService from "./QueueService";
import Queue, { QUEUE_TYPE_BLOCK, QUEUE_TYPE_SYNC } from "../Block/Queue";
import Peers, { PeerConstructor } from "../Block/Peers";
import MiningService from "./MiningService";
const bcrypt = require('bcrypt');
const http = require('http');
const querystring = require('querystring');


export default class ClientService {
    settingsRepo: SettingsRepo;
    blockModel: BlockModel;
    blockRepo: BlockRepo;
    poolRepo: PoolRepo;
    blockValidator: BlockValidator;
    queueService: QueueService;
    miningService: MiningService;

    private hasFullSync: boolean = false;

    constructor(
        settingsRepo: SettingsRepo,
        blockModel: BlockModel,
        blockRepo: BlockRepo,
        poolRepo: PoolRepo,
        blockValidator: BlockValidator,
        queueService: QueueService,
        miningService: MiningService
    ) {
        this.settingsRepo = settingsRepo;
        this.blockModel = blockModel;
        this.blockRepo = blockRepo;
        this.poolRepo = poolRepo;
        this.blockValidator = blockValidator;
        this.queueService = queueService;
        this.miningService = miningService;
    }

    async start() {
        const miningLoop = function (this: ClientService) {
            console.log('Mining loop')
            return new Promise(async function miningLoopPromise(this: ClientService, resolve: CallableFunction, reject: any) {
                if (await this.settingsRepo.isMiningEnabled() === false) {
                    return setTimeout(function miningLoopMiningNotEnabled() {
                        resolve(false);
                    }, 1000 * 10);
                }

                // @TODO FIX ADDRESS
                this.miningService.createAndMineNextBlock(address1).then(function createAndMineNextBlockSuccess(this: ClientService, block: Block) {
                    this.queueService.add(new Queue({
                        type: QUEUE_TYPE_BLOCK,
                        data: block,
                        callback: function blockQueueCallback() {
                            resolve(true);
                        }
                    }));

                }.bind(this)).catch(reject);
            }.bind(this));
        }.bind(this);

        const miningLoopReque = function () {
            // console.log('Mining requed')
            setTimeout(function miningLoopRequeTimeout() {
                miningLoop().then(miningLoopReque).catch(miningLoopReque);
            }, 1);
        }
        miningLoop().then(miningLoopReque).catch(miningLoopReque);


        setInterval(function addQueueClientItems(this: ClientService) {
            if (!this.queueService.hasType(QUEUE_TYPE_SYNC)) {
                this.queueService.add(new Queue({
                    type: QUEUE_TYPE_SYNC,
                    data: true,
                }));
            }
        }.bind(this), 1000);

        this.startQueueLoop();
    }


    startQueueLoop = () => {

        let loopFunction: CallableFunction;
        let item: Queue | undefined;
        loopFunction = function (this: ClientService) {
            item = this.queueService.next();
            if (item) {
                this.processItem(item).then(function processedItemCallback(this: ClientService) {
                    item.doCallback(true);
                    setTimeout(loopFunction.bind(this), 1);
                }.bind(this)).catch(function processedItemError(this: ClientService, error: any) {
                    item.doCallback(false);
                    console.error(error);
                    setTimeout(loopFunction.bind(this), 1);
                }.bind(this));
            } else {
                setTimeout(loopFunction.bind(this), 1);
            }
        };
        setTimeout(loopFunction.bind(this), 1);
    }


    processItem = (queue: Queue): Promise<boolean> => {
        console.log('process item')
        return new Promise(function processItemPromise(this: ClientService, resolve: CallableFunction, reject: any) {
            if (queue.type === QUEUE_TYPE_SYNC) {
                this.loadNextBlock().then(resolve).catch(reject);
            } else if (queue.type === QUEUE_TYPE_BLOCK) {
                this.blockRepo.addBlock(queue.data).then(resolve).catch(reject);
            } else {
                console.error('Queue type not handled ' + queue.type);
                return resolve(false);
            }
        }.bind(this));
    }

    mining = (): Promise<boolean> => {
        // createAndMineNextBlock
        return new Promise(async function miningPromise(this: ClientService, resolve: CallableFunction, reject: any) {
            if (await this.settingsRepo.getSetting(settings.MINING_ENABLED_KEY) !== 'yes') {
                return resolve(false);
            }
            // @TODO address needs to be changed
            this.miningService.createAndMineNextBlock(address1).then(function createAndMineNextBlockSuccess(this: ClientService, block: Block) {
                this.queueService.add(new Queue({
                    type: QUEUE_TYPE_BLOCK,
                    data: block,
                }));
                resolve(true);
            }.bind(this)).catch(reject);

        }.bind(this));
    }

    loadNextBlock = (): Promise<boolean> => {
        return new Promise(async function loadNextBlockPromise(this: ClientService, resolve: CallableFunction, reject: any) {
            this.getBlock(await this.settingsRepo.getLastBlockHeight() + 1).then(function loadNextBlockGetBlock(this: ClientService, block: Block | undefined) {
                if (block && this.blockValidator.isBlockValid(block)) {
                    this.queueService.add(new Queue({
                        type: QUEUE_TYPE_BLOCK,
                        data: block,
                    }));
                }
                return resolve(true);
            }.bind(this)).catch(reject);
        }.bind(this));
    }

    getBlock = (height: number): Promise<Block | undefined> => {
        return new Promise(function getBlockPromise(this: ClientService, resolve: CallableFunction, reject: any) {
            this.request({ action: 'getBlock', height }).then(function getBlockRequest(data) {
                if (undefined !== data['height'] && data['height'] === height) {
                    return resolve(BLOCK_FACTORY.createFromObject(data));
                } else {
                    return resolve(undefined);
                }
            }).catch(reject);
        }.bind(this));
    }

    request = (query: { action: string }, data?: {}): Promise<Object> => {
        return new Promise(function requestPromise(this: ClientService, resolve: CallableFunction, reject: any) {
            this.settingsRepo.getPeers().then(function requestGetPeersSuccess(peers: Peers) {
                const peer = peers.getOne();
                http.get({
                    hostname: peer.ip,
                    port: peer.port,
                    path: '/?' + querystring.stringify(query),
                }, function requestResponse(res: IncomingMessage) {
                    let data = '';
                    res.on('data', function requestReposnseData(chunk: string) {
                        data += chunk;
                    }).on('end', function requestResponseEnd() {
                        resolve(JSON.parse(data));
                    });
                }).on("error", function requestError(err: any) {
                    console.error('ERRRRRRRRRRRRRRRR')
                    reject(err);
                });
            }).catch(reject);
        }.bind(this));
    }
}

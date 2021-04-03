import Storage from "../Storage/Storage";
import Block, { BlockConstructor } from "../Block/Block";
import settings from '../../settings';
import SettingsRepo from '../Repo/SettingsRepo';
import BlockModel from "../Block/BlockModel";
import Address from "../Address/Address";
import BlockRepo from "../Repo/BlockRepo";
import PoolRepo from "../Repo/PoolRepo";
import BlockValidator from "../Validator/BlockValidator";
import { sha256x2, getSecondsBetweenDates, rand } from "../tools";
import { IncomingMessage, ServerResponse } from "http";
import { BLOCK_FACTORY } from "../../globals";
import { isNumber } from "util";
import ClientService from "./ClientService";
import ChainRepo from "../Repo/ChainRepo";
const bcrypt = require('bcrypt');

export default class ApiService {
    methods: { [key: string]: string } = {
        'GET.getBlocks': 'getBlocks',
        'GET.getChainHeight': 'getChainHeight',
        'POST.propagateBlock': 'propagateBlock',
    };
    settingsRepo: SettingsRepo;
    blockModel: BlockModel;
    blockRepo: BlockRepo;
    poolRepo: PoolRepo;
    clientService: ClientService;
    blockValidator: BlockValidator;
    chainRepo: ChainRepo;

    constructor(
        clientService: ClientService,
        settingsRepo: SettingsRepo,
        blockModel: BlockModel,
        blockRepo: BlockRepo,
        poolRepo: PoolRepo,
        blockValidator: BlockValidator,
        chainRepo: ChainRepo
    ) {
        this.clientService = clientService;
        this.settingsRepo = settingsRepo;
        this.blockModel = blockModel;
        this.blockRepo = blockRepo;
        this.poolRepo = poolRepo;
        this.blockValidator = blockValidator;
        this.chainRepo = chainRepo;
    }

    handleRequest = (req: IncomingMessage, res: ServerResponse, query: { action: 'string' }, data?: {}) => {
        const action = req.method + '.' + query['action'];
        if (undefined === query['action'] || undefined === this.methods[action]) {
            return this.end404(res);
        }

        // setTimeout(() => {
        this[this.methods[action]](query, data).then(function handleRequestSuccess(data: {}) {
            res.write(JSON.stringify(data));
            res.end();
            // console.log('ENDING REQUEST ' + action)
        }).catch(function handleRequestError() {
            res.statusCode = 500;
            res.write(JSON.stringify({ error: 'Error 500' }));
            res.end();
            // console.log('ENDING REQUEST ' + action)
        });
        // }, rand(1000, 5000));


    }

    end404 = (res: ServerResponse) => {
        res.statusCode = 404;
        res.write(JSON.stringify({ error: 'Error 401' }));
        res.end();
    }

    async getBlocks(query: { height: number | string }) {
        if (!isNumber(query['height'])) {
            query['height'] = parseInt(query['height']);
        }


        if (query['height'] <= 0 || await this.settingsRepo.getLastBlockHeight() < query['height']) {
            return { error: 'block not found' };
        }

        return {
            blocks: await Promise.all((await this.chainRepo.getHeightBlockNames(query['height'])).map(async function getBlockLoadByName(this: ApiService, blockName: string) {
                return BLOCK_FACTORY.createArrayFromObject(
                    await this.blockRepo.loadFullBlock(
                        await this.blockRepo.getBlockByName(blockName)
                    )
                );
            }.bind(this)))
        };;
    }

    async getChainHeight() {
        return {
            chainHeight: await this.settingsRepo.getLastBlockHeight(),
        };
    }

    async propagateBlock(_, post: { block?: BlockConstructor }) {
        if (post['block']) {
            setTimeout(async function addBlockToQueue(this: ApiService) {
                if (post['block']) {
                    console.log('block received ', post['block']['height'])
                    this.chainRepo.addBlock(BLOCK_FACTORY.createFromObject(post['block']))
                } else {
                    console.log('Block not available ?')
                }
                return true;
            }.bind(this));
        }
        return { sucess: true };
    }
}

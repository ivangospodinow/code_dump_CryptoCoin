import Storage from "../Storage/Storage";
import Block from "../Block/Block";
import settings from '../../settings';
import SettingsRepo from '../Repo/SettingsRepo';
import BlockModel from "../Block/BlockModel";
import Address from "../Address/Address";
import BlockRepo from "../Repo/BlockRepo";


export default class MiningService {
    settingsRepo: SettingsRepo;
    blockModel: BlockModel;
    blockRepo: BlockRepo;

    constructor(settingsRepo: SettingsRepo, blockModel: BlockModel, blockRepo : BlockRepo) {
        this.settingsRepo = settingsRepo;
        this.blockModel = blockModel;
        this.blockRepo = blockRepo;
    }

    /**
     * @TODO dont save it here
     * @param address
     */
    async createNextBlock(address: Address) {
        
        const lastBlock = await this.blockRepo.getBlockByName(await this.settingsRepo.getLastBlockName());
        const block = this.blockModel.createCandidate(address, lastBlock);
        this.blockModel.prepareCandidate(block);
        await this.blockRepo.persist(block);

    }
}

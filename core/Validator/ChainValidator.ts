import Storage from "../Storage/Storage";
import Block from "../Block/Block";
import settings from '../../settings';
import SettingsRepo from '../Repo/SettingsRepo';
import BlockModel from "../Block/BlockModel";
import Address from "../Address/Address";
import BlockRepo from "../Repo/BlockRepo";


export default class ChainValidator {
    blockModel: BlockModel;
    blockRepo: BlockRepo;

    constructor(blockModel: BlockModel, blockRepo : BlockRepo) {
        this.blockModel = blockModel;
        this.blockRepo = blockRepo;
    }

    isValid = (block: Block) : boolean =>  {


        
    }
}

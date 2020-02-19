import Storage from "../Storage/Storage";
import Block from "../Block/Block";
import settings from '../../settings';
import SettingsRepo from '../Repo/SettingsRepo';
import BlockModel from "../Block/BlockModel";
import Address from "../Address/Address";
import BlockRepo from "../Repo/BlockRepo";


export default class AddressService {
    settingsRepo: SettingsRepo;
    blockRepo: BlockRepo;

    constructor(settingsRepo: SettingsRepo, blockRepo : BlockRepo) {
        this.settingsRepo = settingsRepo;
        this.blockRepo = blockRepo;
    }



}

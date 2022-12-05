import Storage from './core/Storage/Storage';
import MysqlStorage from './core/Storage/MysqlStorage';
import settings from './settings';
import BlockModel from './core/Block/BlockModel';
import BlockRepo from './core/Repo/BlockRepo';
import SettingsRepo from './core/Repo/SettingsRepo';
import MiningService from './core/Service/MiningService';
import BlockValidator from './core/Validator/BlockValidator';
import TransactionRepo from './core/Repo/TransactionRepo';
import AddressService from './core/Service/AddressService';
import UtxoRepo from './core/Repo/UtxoRepo';
import PoolRepo from './core/Repo/PoolRepo';
import BlockFactory from './core/Factory/BlockFactory';
import ApiService from './core/Service/ApiService';
import ClientService from './core/Service/ClientService';
import QueueRepo from './core/Repo/QueueRepo';
import QueueService from './core/Service/QueueService';
import Address from './core/Address/Address';
import EventsManager from './core/Events/EventManager';
import ChainRepo from './core/Repo/ChainRepo';
import { rand } from './core/tools';
import PoolItemFactory from './core/Factory/PoolItemFactory';
import TransactionFactory from './core/Factory/TransactionFactory';
import UtxoFactory from './core/Factory/UtxoFactory';
import ChainValidator from './core/Validator/ChainValidator';


export const eventsManager = new EventsManager;
export const mysqlStorage = new MysqlStorage(settings.mysql);
export const storage = new Storage(mysqlStorage);
export const settingsRepo = new SettingsRepo(storage);

export const utxoRepo = new UtxoRepo(storage);
export const transactionRepo = new TransactionRepo(storage, utxoRepo);


export const queueService = new QueueService;
export const blockModel = new BlockModel(storage);
export const validator = new BlockValidator(blockModel);




export const blockRepo = new BlockRepo(storage, transactionRepo, settingsRepo, eventsManager, validator, utxoRepo);
export const queueRepo = new QueueRepo(storage);
export const chainRepo = new ChainRepo(storage, settingsRepo, validator, blockRepo, eventsManager, utxoRepo);
export const poolRepo = new PoolRepo(storage, utxoRepo, eventsManager);

export const mining = new MiningService(settingsRepo, blockModel, blockRepo, poolRepo, eventsManager, chainRepo);
// @TODO fix coupling 
chainRepo.setMiningService(mining);

export const miningService = mining;
export const clientService = new ClientService(settingsRepo, blockModel, blockRepo, poolRepo, validator, queueService, mining, eventsManager, chainRepo);
export const apiService = new ApiService(clientService, settingsRepo, blockModel, blockRepo, poolRepo, validator, chainRepo);

export const chainValidator = new ChainValidator(settingsRepo, chainRepo, blockRepo);


export const addressService = new AddressService(settingsRepo, blockRepo);

export const BLOCK_VALIDATOR = new BlockValidator(blockModel);
export const BLOCK_FACTORY = new BlockFactory;
export const POOL_ITEM_FACTORY = new PoolItemFactory;
export const TRANSACTION_FACTORY = new TransactionFactory;
export const UTXO_FACTORY = new UtxoFactory;

export const currentAddress = new Address(settings['addresses'][settings.NODE]['public'], settings['addresses'][settings.NODE]['private']);

export const address1 = new Address(settings['addresses'][0]['public'], settings['addresses'][0]['private']);
export const address2 = new Address(settings['addresses'][1]['public'], settings['addresses'][1]['private']);
export const address3 = new Address(settings['addresses'][2]['public'], settings['addresses'][2]['private']);

export const TMP_MINING_ADDRESS = new Address(settings['addresses'][settings.NODE]['public'], settings['addresses'][settings.NODE]['private']);

export function getRandomTestAddress(): Address {
    let addrPair = settings.addresses[rand(0, settings.addresses.length - 1)];
    return new Address(addrPair['public'], addrPair['private']);
}
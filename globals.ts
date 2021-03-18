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

export const eventsManager = new EventsManager;
export const mysqlStorage = new MysqlStorage(settings.mysql);
export const storage = new Storage(mysqlStorage);

export const transactionRepo = new TransactionRepo(storage);

export const settingsRepo = new SettingsRepo(storage);
export const queueService = new QueueService;
export const blockModel = new BlockModel(storage);
export const validator = new BlockValidator(blockModel);

export const utxoRepo = new UtxoRepo(storage, transactionRepo);

export const blockRepo = new BlockRepo(storage, transactionRepo, settingsRepo, eventsManager, validator, utxoRepo);
export const queueRepo = new QueueRepo(storage);


export const poolRepo = new PoolRepo(storage, transactionRepo, utxoRepo);

export const mining = new MiningService(settingsRepo, blockModel, blockRepo, poolRepo, eventsManager);
export const miningService = mining;
export const clientService = new ClientService(settingsRepo, blockModel, blockRepo, poolRepo, validator, queueService, mining, eventsManager);
export const apiService = new ApiService(clientService, settingsRepo, blockModel, blockRepo, poolRepo, validator);



export const addressService = new AddressService(settingsRepo, blockRepo);



export const BLOCK_FACTORY = new BlockFactory;

export const address1 = new Address(settings['addresses'][0]['public'], settings['addresses'][0]['private']);
export const address2 = new Address(settings['addresses'][1]['public'], settings['addresses'][1]['private']);

export const TMP_MINING_ADDRESS = new Address(settings['addresses'][settings.NODE]['public'], settings['addresses'][settings.NODE]['private'])


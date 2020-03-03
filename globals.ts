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

export const storage = new Storage(new MysqlStorage(settings.mysql));

export const transactionRepo = new TransactionRepo(storage);

export const blockModel = new BlockModel(storage);
export const blockRepo = new BlockRepo(storage, transactionRepo);

export const settingsRepo = new SettingsRepo(storage);
export const utxoRepo = new UtxoRepo(storage, transactionRepo);
export const poolRepo = new PoolRepo(storage, transactionRepo, utxoRepo);
export const mining = new MiningService(settingsRepo, blockModel, blockRepo, poolRepo);
export const validator = new BlockValidator(blockModel, blockRepo);

export const addressService = new AddressService(settingsRepo, blockRepo);

export const BLOCK_FACTORY = new BlockFactory;
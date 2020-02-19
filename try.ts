// var EC = require('elliptic').ec;
// var ec = new EC('secp256k1');

// // Generate keys
// var key = ec.genKeyPair();

// console.log(key, key.getPublic().encode('hex'))

import Storage from './core/Storage/Storage';
import MysqlStorage from './core/Storage/MysqlStorage';
import settings from './settings';
import { rand } from './core/tools';
import BlockModel from './core/Block/BlockModel';
import Address from './core/Address/Address';
import BlockRepo from './core/Repo/BlockRepo';
import SettingsRepo from './core/Repo/SettingsRepo';
import MiningService from './core/Service/MiningService';
import Block from './core/Block/Block';
import BlockValidator from './core/Validator/BlockValidator';
import TransactionRepo from './core/Repo/TransactionRepo';
import AddressService from './core/Service/AddressService';
const cryptoRandomString = require('crypto-random-string');

const storage = new Storage(new MysqlStorage(settings.mysql));

const address = new Address(settings['addresses'][0]['public'], settings['addresses'][0]['private']);
const transactionRepo = new TransactionRepo(storage);

const blockModel = new BlockModel(storage);
const blockRepo = new BlockRepo(storage, transactionRepo);

// let block = blockModel.createCandidate(address);
// block = blockModel.prepareCandidate(block);


// console.log(block)

const settingsRepo = new SettingsRepo(storage);

const mining = new MiningService(settingsRepo, blockModel, blockRepo);
const validator = new BlockValidator(blockModel, blockRepo);

const addressService = new AddressService(settingsRepo, blockRepo);


// blockRepo.getBlockByHeight(1).then((block : Block) => {
//     blockRepo.loadFullBlock(block).then((block) => {

//         console.log(validator.isBlockValid(block));
//     }).catch(error => console.error(error));
    
// });

// function donextblock() {
//     mining.createNextBlock(address).finally(donextblock);
// }

// donextblock();

// mining.createNextBlock(address);
// setTimeout(() => {
//     mining.createNextBlock(address);
// }, 100);

// console.log('here')
// setInterval(() => {
//     mining.createNextBlock(address);
// }, 10);


// console.log(settingsRepo.getLastBlockName());

// const repo = new BlockRepo(storage);
// repo.persist(block);





// console.log(blockModel)

// const BC = require('./core/Block');

// var insert = function() {
//     storage.put(
//         cryptoRandomString({ length: rand(50, 120) }),
//         cryptoRandomString({ length: rand(1024, 2048) }),
//         insert
//     );
// }
// insert();
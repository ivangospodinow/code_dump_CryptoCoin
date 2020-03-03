// var EC = require('elliptic').ec;
// var ec = new EC('secp256k1');

// // Generate keys
// var key = ec.genKeyPair();

// console.log(key, key.getPublic().encode('hex'))

import Storage from './core/Storage/Storage';
import MysqlStorage from './core/Storage/MysqlStorage';
import settings from './settings';
import { rand, sha256x2 } from './core/tools';
import BlockModel from './core/Block/BlockModel';
import Address from './core/Address/Address';
import BlockRepo from './core/Repo/BlockRepo';
import SettingsRepo from './core/Repo/SettingsRepo';
import MiningService from './core/Service/MiningService';
import Block from './core/Block/Block';
import BlockValidator from './core/Validator/BlockValidator';
import TransactionRepo from './core/Repo/TransactionRepo';
import AddressService from './core/Service/AddressService';
import UtxoRepo from './core/Repo/UtxoRepo';
import PoolRepo from './core/Repo/PoolRepo';
const cryptoRandomString = require('crypto-random-string');

const storage = new Storage(new MysqlStorage(settings.mysql));

const address = new Address(settings['addresses'][0]['public'], settings['addresses'][0]['private']);
const address2 = new Address(settings['addresses'][1]['public'], settings['addresses'][1]['private']);

const transactionRepo = new TransactionRepo(storage);

const blockModel = new BlockModel(storage);
const blockRepo = new BlockRepo(storage, transactionRepo);

// let block = blockModel.createCandidate(address);
// block = blockModel.prepareCandidate(block);


// console.log(block)

const settingsRepo = new SettingsRepo(storage);
const utxoRepo = new UtxoRepo(storage, transactionRepo);
const poolRepo = new PoolRepo(storage, transactionRepo, utxoRepo);
const mining = new MiningService(settingsRepo, blockModel, blockRepo, poolRepo);
const validator = new BlockValidator(blockModel, blockRepo);

const addressService = new AddressService(settingsRepo, blockRepo);


// const bcrypt = require('bcrypt');

// let hashed = '';
// function nextHash() {
//     bcrypt.genSalt(5, function(err, salt) {
//         bcrypt.hash('45036c5304cc511c95d88bcf6b039a25d429b48ce820cad2fd11f0bcdf9cdb2e', salt, function(err, hash) {
//             hashed = sha256x2(hash);
//             console.log(salt + ' ' + hash + ' ' + hashed);
//             if (hashed.substr(0, 4) !== '0000') {
//                 nextHash();
//             }
//         });
//     });
// }
// nextHash();


// var salt = '$2b$10$Wk7rE6JGjPKlMOMhgLKTtO';
// bcrypt.hash('45036c5304cc511c95d88bcf6b039a25d429b48ce820cad2fd11f0bcdf9cdb2e', salt, function(err, hash) {
//     console.log(salt + ' ' + hash + ' ' + sha256x2(hash));
// });


// utxoRepo.getOutputsForValue(address, 5).then((utxos) => {
//     let transaction = blockModel.createPayToAddressTransaction(address, address2, utxos, 4.512312);
//     if (transaction) {
//         poolRepo.persist(transaction);
//     }
// });


// createArrayFromObject

// blockRepo.getBlockByHeight(1).then((block : Block) => {
//     blockRepo.loadFullBlock(block).then((block) => {

//         console.log(validator.isBlockValid(block));
//     }).catch(error => console.error(error));
    
// });
// console.log('START');
// function donextblock() {
//     mining.createNextBlock(address).finally(donextblock);
// }

// donextblock();
// console.log('here')
// mining.createNextBlock(address).then((block) => {
//     blockRepo.persist(block);
//     console.log('Block')
//     // mining.mine(block).then((result) => {
//     //     console.log(result)
//     // });
// });


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


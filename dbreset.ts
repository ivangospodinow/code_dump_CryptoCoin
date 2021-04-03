import Storage from './core/Storage/Storage';
import MysqlStorage from './core/Storage/MysqlStorage';
import settings from './settings';
import SettingsRepo from './core/Repo/SettingsRepo';
import { address1, miningService, blockRepo, storage, settingsRepo, mysqlStorage, chainRepo } from './globals';
import { MineResult } from './core/Service/MiningService';
import { getTimestampString } from './core/tools';
const fs = require('fs')

const namespaces = [
    'chain',
    'block',
    'pool',
    'setting',
    'transaction',
    'utxo',
    'queue',
];


let sql = namespaces.map((name) => {
    return "TRUNCATE `" + name + "`;\n";
}).join('');

sql += fs.readFileSync('data/reset.sql', 'utf8');
sql = sql.replace(/2021-03-29T16:51:14.274Z/g, getTimestampString());


mysqlStorage.connection.query(sql, [], async function queryCallback(error: any, result: any) {

    const peers = settings.nodes.filter(ndpair => ndpair['port'] !== settings.SERVER_PORT).map((portPair) => {
        return { ip: '127.0.0.1', port: portPair['port'] };
    });

    await settingsRepo.setSetting(settings.PEERS_KEY, { peers: peers });

    console.log('Done')
    process.exit();
    // const peers = settings.nodes.filter(ndpair => ndpair['port'] !== settings.SERVER_PORT).map((portPair) => {
    //     return { ip: '127.0.0.1', port: portPair['port'] };
    // });

    // await settingsRepo.setSetting(settings.PEERS_KEY, { peers: peers });
    // // await settingsRepo.setSetting(settings.MINING_ENABLED_KEY, settings.NODE === 0 ? 'yes' : 'no');
    // await settingsRepo.setSetting(settings.MINING_ENABLED_KEY, 'yes');



    // console.log('storage resetted', settings.NODE)
    // if (settings.NODE === 0) {
    //     const block = await miningService.createNextBlock(address1);
    //     miningService.mine(block, address1).then(async function blockMinedSuccess(resultResult: MineResult) {
    //         block.target = resultResult['target'];
    //         block.nonce = resultResult['nonce'];
    //         block.hash = resultResult['hash'];
    //         block.weight = resultResult['weight'];
    //         block.chainWeight = block.weight;

    //         block.timestamp = getTimestampString();

    //         await chainRepo.addBlock(block);
    //         console.log('done')
    //         process.exit();

    //     });
    // } else {
    //     process.exit();
    // }

});



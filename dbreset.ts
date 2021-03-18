import Storage from './core/Storage/Storage';
import MysqlStorage from './core/Storage/MysqlStorage';
import settings from './settings';
import SettingsRepo from './core/Repo/SettingsRepo';
import { address1, miningService, blockRepo, storage, settingsRepo, mysqlStorage } from './globals';
import { MineResult } from './core/Service/MiningService';
import { getTimestampString } from './core/tools';

const namespaces = [
    'block',
    'pool',
    'setting',
    'transaction',
    'utxo',
    'queue',
];

const sql = namespaces.map((name) => {
    return "TRUNCATE `" + name + "`";
}).join(";\n");

mysqlStorage.connection.query(sql, [], async function queryCallback(error: any, result: any) {

    const peers = settings.nodes.filter(ndpair => ndpair['port'] !== settings.SERVER_PORT).map((portPair) => {
        return { ip: '192.168.0.3', port: portPair['port'] };
    });

    await settingsRepo.setSetting(settings.PEERS_KEY, { peers: peers });
    // await settingsRepo.setSetting(settings.MINING_ENABLED_KEY, settings.NODE === 0 ? 'yes' : 'no');
    await settingsRepo.setSetting(settings.MINING_ENABLED_KEY, 'yes');

    console.log('storage resetted')

    const block = await miningService.createNextBlock(address1);
    miningService.mine(block).then(async function blockMinedSuccess(resultResult: MineResult) {
        block.target = resultResult['target'];
        block.nonce = resultResult['nonce'];
        block.timestamp = getTimestampString();

        await blockRepo.addBlock(block, { chainHeight: 0 });
        console.log('done')
        process.exit();

    });
});



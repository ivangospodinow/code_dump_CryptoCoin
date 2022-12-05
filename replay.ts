import { validator, address1, blockModel, blockRepo, chainRepo, settingsRepo, transactionRepo, utxoRepo, currentAddress, getRandomTestAddress, poolRepo, BLOCK_FACTORY, chainValidator } from "./globals";
import Block from "./core/Block/Block";
import { addressCreate } from "./core/Address/Address";
import Transaction from "./core/Block/Transaction";
import TransactionInput from "./core/Block/TransactionInput";
import TransactionOutput from "./core/Block/TransactionOutput";
import settings from './settings';

chainRepo.replay = false;


(async function () {
    var readlines = require('n-readlines');
    var liner = new readlines(__dirname + '/replay_' + settings.NODE + '.txt');

    var next;
    while (next = liner.next()) {
        next = next.toString();
        if (next) {
            let block = BLOCK_FACTORY.createFromString(next);
            console.log('Replay', block.name, block.height)
            await chainRepo.addBlock(block);
        }
    }

    console.log('DONE');

    const isChainValid = await chainValidator.isNodeValid();
    console.log('valid', isChainValid);

    process.exit();

})();
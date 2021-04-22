import { validator, address1, blockModel, blockRepo, chainRepo, settingsRepo, transactionRepo, utxoRepo, currentAddress, getRandomTestAddress, poolRepo } from "./globals";
import Block from "./core/Block/Block";
import { addressCreate } from "./core/Address/Address";
import Transaction from "./core/Block/Transaction";
import { settings } from "cluster";
import TransactionInput from "./core/Block/TransactionInput";
import TransactionOutput from "./core/Block/TransactionOutput";



(async function () {
    console.log('validator start');

    const chainHeight = await settingsRepo.getLastBlockHeight();
    let block: Block;
    let blockName: string;
    let transaction: Transaction;
    let input: TransactionInput;
    let output: TransactionOutput;
    let inputValue = 0;
    let outputValue = 0;

    let utxo: any = {};

    for (let i = 1; i <= chainHeight; i++) {


        blockName = await chainRepo.getHeightBlock(i);
        console.log('Block ', i, blockName);
        block = await blockRepo.loadFullBlock(await blockRepo.getBlockByName(blockName));

        console.log('TX count', block.transactions.length);
        // console.log(block.transactions)
        for (transaction of block.transactions) {
            inputValue = 0;
            outputValue = 0;

            for (input of transaction.inputs) {
                inputValue += input.getValue();
                if (!input.isCoinbaseInput()) {
                    // console.log(input.transactionName + '.' + input.outputNum)
                    if (true !== utxo[input.transactionName + '.' + input.outputNum]) {
                        console.log('INVALID UTXO', utxo[input.transactionName + '.' + input.outputNum]);
                        process.exit();
                    }
                    utxo[input.transactionName + '.' + input.outputNum] = blockName + ' ' + i;
                }


            }

            for (output of transaction.outputs) {
                outputValue += output.getValue();
                utxo[transaction.name + '.' + output.num] = true;
            }

            if (inputValue !== outputValue) {
                console.log('Input and otput values are not equal ', inputValue, outputValue);
                process.exit();
            }

        }
    }

    console.log('chain validate successfully');
    process.exit();
})();

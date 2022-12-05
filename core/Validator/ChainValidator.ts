
import Block from "../Block/Block";
import SettingsRepo from '../Repo/SettingsRepo';
import BlockRepo from "../Repo/BlockRepo";
import Transaction from "../Block/Transaction";
import TransactionInput from "../Block/TransactionInput";
import TransactionOutput from "../Block/TransactionOutput";
import ChainRepo from "../Repo/ChainRepo";

export default class ChainValidator {
    settingsRepo: SettingsRepo;
    chainRepo: ChainRepo;
    blockRepo: BlockRepo;

    constructor(settingsRepo: SettingsRepo, chainRepo: ChainRepo, blockRepo: BlockRepo) {
        this.settingsRepo = settingsRepo;
        this.chainRepo = chainRepo;
        this.blockRepo = blockRepo;
    }

    async isNodeValid(): Promise<boolean> {
        const chainHeight = await this.settingsRepo.getLastBlockHeight();
        let block: Block;
        let blockName: string;
        let transaction: Transaction;
        let input: TransactionInput;
        let output: TransactionOutput;
        let inputValue = 0;
        let outputValue = 0;

        let utxo: any = {};
        let isValid: boolean = true;
        console.log('====== VALIDATOR ======');

        for (let i = 1; i <= chainHeight; i++) {

            blockName = await this.chainRepo.getHeightBlock(i);
            block = await this.blockRepo.loadFullBlock(await this.blockRepo.getBlockByName(blockName));

            for (transaction of block.transactions) {
                inputValue = 0;
                outputValue = 0;

                for (input of transaction.inputs) {
                    inputValue += input.getValue();
                    if (!input.isCoinbaseInput()) {
                        // console.log(input.transactionName + '.' + input.outputNum)
                        if (true !== utxo[input.transactionName + '.' + input.outputNum]) {
                            console.log('CV INVALID UTXO', input.transactionName + '.' + input.outputNum, block.name, block.height, 'used in', utxo[input.transactionName + '.' + input.outputNum]);
                            isValid = false;
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
                    isValid = false;
                }

            }
        }

        console.log('====== VALIDATOR END ======');
        return isValid;
    }
}

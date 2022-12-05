import { blockModel, getRandomTestAddress, poolRepo, utxoRepo, validator } from "../globals";

export default class ClientTestDataSeeder {

    start = () => {
        this.continiusTransactionsSeed();
    }

    private continiusTransactionsSeed() {
        let addr = getRandomTestAddress();
        let amount = 0;
        let utxos;
        let utxo;
        let transaction;

        async function loopData() {
            addr = getRandomTestAddress();
            amount = 0;
            utxos = await utxoRepo.getOutputsForValue(addr, amount);
            for (utxo of utxos) {
                amount += utxo.getValue();
            }
            amount = Math.ceil(amount / 10000);

            if (utxos.length) {
                transaction = blockModel.createPayToAddressTransaction(addr, getRandomTestAddress(), utxos, amount);
                if (transaction) {
                    await poolRepo.addTransaction(transaction);
                }
            }

            setTimeout(loopData, 100);
        }

        loopData();
    }

}
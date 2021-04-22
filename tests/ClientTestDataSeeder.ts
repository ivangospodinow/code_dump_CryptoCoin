import { blockModel, getRandomTestAddress, poolRepo, utxoRepo, validator } from "../globals";

export default class ClientTestDataSeeder {

    start = () => {
        this.continiusTransactionsSeed();
    }

    private continiusTransactionsSeed() {
        setInterval(async function () {
            let addr = getRandomTestAddress();
            let amount = 0;
            const utxos = await utxoRepo.getOutputsForValue(addr, amount);
            for (let utxo of utxos) {
                amount += utxo.getValue();
            }
            amount = Math.ceil(amount / 10000);

            if (utxos.length) {
                const transaction = blockModel.createPayToAddressTransaction(addr, getRandomTestAddress(), utxos, amount);
                if (transaction) {
                    await poolRepo.addTransaction(transaction);
                }
            }
        }, 100);
    }

}
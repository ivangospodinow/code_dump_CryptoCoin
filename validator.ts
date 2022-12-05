import { chainValidator } from "./globals";

(async function () {
    console.log('validator start');

    const isChainValid = await chainValidator.isNodeValid();
    console.log('valid', isChainValid);
    process.exit();
})();

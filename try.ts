import { validator, address1, blockModel, blockRepo, chainRepo, settingsRepo, transactionRepo, utxoRepo, currentAddress, getRandomTestAddress, poolRepo } from "./globals";
import Block from "./core/Block/Block";
import { addressCreate } from "./core/Address/Address";
import Transaction from "./core/Block/Transaction";





(async function () {
    const amount = 5;
    const utxos = await utxoRepo.getOutputsForValue(currentAddress, amount);
    const transaction = blockModel.createPayToAddressTransaction(currentAddress, getRandomTestAddress(), utxos, amount / 2);
    console.log(validator.isTransactionValid(transaction))
    if (transaction) {
        await poolRepo.addTransaction(transaction);
    }


})();


//673233f112f35e2c39f6e74f9121373150cff1691f6292c0ebe7c476b2844ba1

// (async function () {
//     // const block = await blockRepo.getBlockByName('673233f112f35e2c39f6e74f9121373150cff1691f6292c0ebe7c476b2844ba1');
//     // console.log(await chainRepo.processAddedBlock(block));
//     let blocks = [];
//     blocks.push(await blockRepo.getBlockByName('f3a747b5baaa425fa4197606ea7f6655b8d226212aa87442cb14a35d158db776'));
//     blocks.push(await blockRepo.getBlockByName('6ac24c27fd024a82d17c2e18c9068304e44f360718961ca3eebca6df8b839934'));

//     console.log(await chainRepo.getBlocksChains(blocks))


// })();


/**
OK - Check syntactic correctness
OK - Reject if duplicate of block we have in any of the three categories
OK - Transaction list must be non-empty
OK - Block hash must satisfy claimed nBits proof of work
NOT - Block timestamp must not be more than two hours in the future
OK - First transaction must be coinbase (i.e. only 1 input, with hash=0, n=-1), the rest must not be
OK - For each transaction, apply "tx" checks 2-4
OK - For the coinbase (first) transaction, scriptSig length must be 2-100
NOT - Reject if sum of transaction sig opcounts > MAX_BLOCK_SIGOPS
NOT - Verify Merkle hash
TODO - Check if prev block (matching prev hash) is in main branch or side branches. If not, add this to orphan blocks, then query peer we got this from for 1st missing orphan block in prev chain; done with block
OK - Check that nBits value matches the difficulty rules
??? - Reject if timestamp is the median time of the last 11 blocks or before
NOT - For certain old blocks (i.e. on initial block download) check that hash matches known values


Add block into the tree. There are three cases: 
    1. block further extends the main branch;
    2. block extends a side branch but does not add enough difficulty to make it become the new main branch;
    3. block extends a side branch and makes it the new main branch.
 

 For case 1, adding to main branch:

    For all but the coinbase transaction, apply the following:
        
        OK - For each input, look in the main branch to find the referenced output transaction. Reject if the output transaction is missing for any input.
        
        For each input, if we are using the nth output of the earlier transaction, but it has fewer than n+1 outputs, reject.
        For each input, if the referenced output transaction is coinbase (i.e. only 1 input, with hash=0, n=-1), it must have at least COINBASE_MATURITY (100) confirmations; else reject.
        Verify crypto signatures for each input; reject if any are bad
        For each input, if the referenced output has already been spent by a transaction in the main branch, reject
        Using the referenced output transactions to get input values, check that each input value, as well as the sum, are in legal money range
        Reject if the sum of input values < sum of output values
    Reject if coinbase value > sum of block creation fee and transaction fees
    (If we have not rejected):
    For each transaction, "Add to wallet if mine"
    For each transaction in the block, delete any matching transaction from the transaction pool
    Relay block to our peers
    If we rejected, the block is not counted as part of the main branch

For case 2, adding to a side branch, we don't do anything.
For case 3, a side branch becoming the main branch:

    Find the fork block on the main branch which this side branch forks off of
    Redefine the main branch to only go up to this fork block
    For each block on the side branch, from the child of the fork block to the leaf, add to the main branch:
        Do "branch" checks 3-11
        For all but the coinbase transaction, apply the following:
            For each input, look in the main branch to find the referenced output transaction. Reject if the output transaction is missing for any input.
            For each input, if we are using the nth output of the earlier transaction, but it has fewer than n+1 outputs, reject.
            For each input, if the referenced output transaction is coinbase (i.e. only 1 input, with hash=0, n=-1), it must have at least COINBASE_MATURITY (100) confirmations; else reject.
            Verify crypto signatures for each input; reject if any are bad
            For each input, if the referenced output has already been spent by a transaction in the main branch, reject
            Using the referenced output transactions to get input values, check that each input value, as well as the sum, are in legal money range
            Reject if the sum of input values < sum of output values
        Reject if coinbase value > sum of block creation fee and transaction fees
        (If we have not rejected):
        For each transaction, "Add to wallet if mine"
    If we reject at any point, leave the main branch as what it was originally, done with block
    For each block in the old main branch, from the leaf down to the child of the fork block:
        For each non-coinbase transaction in the block:
            Apply "tx" checks 2-9, except in step 8, only look in the transaction pool for duplicates, not the main branch
            Add to transaction pool if accepted, else go on to next transaction
    For each block in the new main branch, from the child of the fork node to the leaf:
        For each transaction in the block, delete any matching transaction from the transaction pool
    Relay block to our peers

For each orphan block for which this block is its prev, run all these steps (including this one) recursively on that orphan
*/




console.log((2).toString())











// const bcrypt = require('bcrypt');
// const converter = require('hex2dec');
// const bs58 = require('bs58')

// import { buf2hex, hexdump } from './core/tools';
// import settings from './settings';
// import { sha256x2 } from './core/tools';

// let mineBase = sha256x2('0007b5c9977bd505c4f1409a9dec3b35e02d4e477874e90bc3cdf08d7fa07885' + '0007b5c9977bd505c4f1409a9dec3b35e02d4e477874e90bc3cdf08d7fa07885');
// const target = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' / 20;
// function mine() {
//     bcrypt.genSalt(settings.BCRYPT_SALT_SIZE, function (err: any, salt: string) {

//         bcrypt.hash(mineBase, salt, function (err: any, hash: string) {
//             if (parseInt(sha256x2(hash), 16) <= target) {
//                 console.log(salt)
//                 return;
//             }

//             // mine();
//         });
//     });
// }
// mine();
// // console.log(parseInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 16));
// // // console.log('0x' + (Buffer.from(sha256x2('test'), 'ascii').toString('hex')+0x10000).toString(16).substr(-4).toUpperCase())
// // console.log('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'/ 2)

// // console.log('2.7433500304463812e+153' / '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
// console.log(parseInt('0x00000000ffff0000000000000000000000000000000000000000000000000000', 16));

// // let hex = Buffer.from('0007b5c9977bd505c4f1409a9dec3b35e02d4e477874e90bc3cdf08d7fa07885', 'utf8').toString('hex');

// // console.log(hex);
// // console.log(parseInt(hex, 16));

// // // console.log('30303037623563393937376264353035633466313430396139646563336233356530326434653437373837346539306263336364663038643766613037383835'.length)

// // // console.log(Buffer.from('0007b5c9977bd505c4f1409a9dec3b35e02d4e477874e90bc3cdf08d7fa07885', 'hex'))
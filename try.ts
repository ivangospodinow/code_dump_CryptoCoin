import { validator, address1, blockModel, blockRepo, chainRepo, settingsRepo, transactionRepo, utxoRepo, currentAddress, getRandomTestAddress, poolRepo, BLOCK_FACTORY, miningService } from "./globals";
import Block from "./core/Block/Block";
import Address, { addressCreate } from "./core/Address/Address";
import Transaction from "./core/Block/Transaction";
import ClientTestDataSeeder from "./tests/ClientTestDataSeeder";


setTimeout(async function () {
    // const tmpAddress = getRandomTestAddress();
    // let block = await miningService.createNextBlock(tmpAddress);

    // console.log(JSON.stringify(BLOCK_FACTORY.createArrayFromObject(block)));

    var blockStr = '{"height":3,"status":"valid-fork","name":"f4b7d42036f557bda0bcddf3a7caf122e5c64e4d9cc88ebcbddda6765206ba3e","prevBlockName":"09f4b9f6c162196b7661f1e5dc4d5dcade826a84fab8355767d4ab825320c800","weight":2,"chainWeight":1.197662484632763,"target":1,"nonce":"","hash":0,"timestamp":1619458349.15,"transactionsNames":[],"transactions":[{"name":"a0da48c1b1b8849befc1f2813c5ad6bebc72d23416f132cabe2547ae8b80f727","num":0,"blockName":"f4b7d42036f557bda0bcddf3a7caf122e5c64e4d9cc88ebcbddda6765206ba3e","inputs":[{"num":0,"script":3,"output":null}],"outputs":[{"num":0,"value":100000000,"script":"PPK 04245fe463ea70dcff53cce582ce9e43a905d9c03976724f76c38a57be674e9bc47d2f40a5807cb3740ff61a986845c05e04530dbc69cf776d1abffeaebd9e3aba","address":"04245fe463ea70dcff53cce582ce9e43a905d9c03976724f76c38a57be674e9bc47d2f40a5807cb3740ff61a986845c05e04530dbc69cf776d1abffeaebd9e3aba"}]},{"name":"15de7edf7a4a8cae42cfe5e820b6afed8a93d5cdb148cbff283b0d0c02efe3ae","num":1,"blockName":"f4b7d42036f557bda0bcddf3a7caf122e5c64e4d9cc88ebcbddda6765206ba3e","inputs":[{"num":0,"outputNum":0,"transactionName":"bb1397f6d465a1c4eb9ae5e9a551aa605da6198e224ed9d9a2a3b363ed873945","script":"SIGN 3044022059d446be5f1328797239627f35e9dca31e47693251a1693ca830b3f7869a7376022041d6419b2d67c38423dda97995b916a41c52049f7c250d4bdb2b6299e72d25af ADDRESS 04245fe463ea70dcff53cce582ce9e43a905d9c03976724f76c38a57be674e9bc47d2f40a5807cb3740ff61a986845c05e04530dbc69cf776d1abffeaebd9e3aba","output":null}],"outputs":[{"num":0,"value":10000,"script":"PPK 043be9ea9a3988b00427abaf453b255fc984ba558eceafa6993b6b15a9629bd0ae31edf4623d96a32326a5a2051c8017f867cb7bd6b0fe8c9d7fd031eec35b8712","address":"043be9ea9a3988b00427abaf453b255fc984ba558eceafa6993b6b15a9629bd0ae31edf4623d96a32326a5a2051c8017f867cb7bd6b0fe8c9d7fd031eec35b8712"},{"num":1,"value":99990000,"script":"PPK 04245fe463ea70dcff53cce582ce9e43a905d9c03976724f76c38a57be674e9bc47d2f40a5807cb3740ff61a986845c05e04530dbc69cf776d1abffeaebd9e3aba","address":"04245fe463ea70dcff53cce582ce9e43a905d9c03976724f76c38a57be674e9bc47d2f40a5807cb3740ff61a986845c05e04530dbc69cf776d1abffeaebd9e3aba"}]},{"name":"27926b72a83b7268d0e77558cf7c036ccda7b10bef8ac2c06ca19f357f5356ec","num":2,"blockName":"f4b7d42036f557bda0bcddf3a7caf122e5c64e4d9cc88ebcbddda6765206ba3e","inputs":[{"num":0,"outputNum":1,"transactionName":"0a6ef0e6b963435000d5533c107ab6f843d5a7d8a53b4bb8fcbbe9947b8aae42","script":"SIGN 3045022100aa3e6e4deb1be7cc8a83a1b731e8b983a31452d8170de680f4ebb4780528a40a02202e1dd511ee37b2abd857863ceacb16d1384c3832019f6d4845e2b828a60dafc9 ADDRESS 0452b239584f1f9365e6840209423812c6ff58e2df636f76d48ba95b50d4133ed6bd9cdc80815ac286e8c5286607c1a4e68111362b9e432e8311bd3b57264131ed","output":null}],"outputs":[{"num":0,"value":19999,"script":"PPK 04245fe463ea70dcff53cce582ce9e43a905d9c03976724f76c38a57be674e9bc47d2f40a5807cb3740ff61a986845c05e04530dbc69cf776d1abffeaebd9e3aba","address":"04245fe463ea70dcff53cce582ce9e43a905d9c03976724f76c38a57be674e9bc47d2f40a5807cb3740ff61a986845c05e04530dbc69cf776d1abffeaebd9e3aba"},{"num":1,"value":99970001,"script":"PPK 0452b239584f1f9365e6840209423812c6ff58e2df636f76d48ba95b50d4133ed6bd9cdc80815ac286e8c5286607c1a4e68111362b9e432e8311bd3b57264131ed","address":"0452b239584f1f9365e6840209423812c6ff58e2df636f76d48ba95b50d4133ed6bd9cdc80815ac286e8c5286607c1a4e68111362b9e432e8311bd3b57264131ed"}]},{"name":"a2c5b5e1dbf994a959b1d7269c7f6d3791f769c43eda7817459233b76fd413a7","num":3,"blockName":"f4b7d42036f557bda0bcddf3a7caf122e5c64e4d9cc88ebcbddda6765206ba3e","inputs":[{"num":0,"outputNum":0,"transactionName":"0a6ef0e6b963435000d5533c107ab6f843d5a7d8a53b4bb8fcbbe9947b8aae42","script":"SIGN 3046022100a59d476530e040d4670ac7f6ba8629559edcce3580964bf9e26aec55ec055c6e02210096accc078eeca18e70e9eea95f3c9d494faabf43d8baabf54ea10e1f20c0e63f ADDRESS 0480baefceec61310934d0a1d6ba17459c5241ba65560835141d0c72c45a253f649e2c44b219e12828cf1b0c3c100cd100717c67a684f59f5bb3480fe3c6654dad","output":null}],"outputs":[{"num":0,"value":1,"script":"PPK 0452b239584f1f9365e6840209423812c6ff58e2df636f76d48ba95b50d4133ed6bd9cdc80815ac286e8c5286607c1a4e68111362b9e432e8311bd3b57264131ed","address":"0452b239584f1f9365e6840209423812c6ff58e2df636f76d48ba95b50d4133ed6bd9cdc80815ac286e8c5286607c1a4e68111362b9e432e8311bd3b57264131ed"},{"num":1,"value":9999,"script":"PPK 0480baefceec61310934d0a1d6ba17459c5241ba65560835141d0c72c45a253f649e2c44b219e12828cf1b0c3c100cd100717c67a684f59f5bb3480fe3c6654dad","address":"0480baefceec61310934d0a1d6ba17459c5241ba65560835141d0c72c45a253f649e2c44b219e12828cf1b0c3c100cd100717c67a684f59f5bb3480fe3c6654dad"}]}]}';
    var block = BLOCK_FACTORY.createFromString(blockStr);

    chainRepo.addBlock(block);
    console.log(block.name, block.height)

    // console.log(block)
});


// const seeder = new ClientTestDataSeeder;
// seeder.start();

// setInterval(function () {
//     const used = process.memoryUsage().heapUsed / 1024 / 1024;
//     console.log(`${Math.round(used * 100) / 100} MB`);
// }, 1000);


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
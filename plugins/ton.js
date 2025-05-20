let { TonClient, WalletContractV4, toNano, Address, beginCell, internal } = require("ton");
let { mnemonicNew, mnemonicToPrivateKey } = require("ton-crypto");
const config = require('config');
const stringRandom = require("string-random")

const client = new TonClient({
    endpoint: config.ton.RPC,
    apiKey: config.ton.API_KEY
});

async function send(internals) {

    // Generate new key
    let mnemonics = config.ton.MNEMONICS
    let keyPair = await mnemonicToPrivateKey(mnemonics);
    let workchain = 0; // Usually you need a workchain 0
    let wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey });

    let contract = client.open(wallet);
    console.log(contract.address)

    let seqno = await contract.getSeqno();
    let transfer = await contract.createTransfer({
        secretKey: keyPair.secretKey,
        seqno,
        messages: internals
    });

    let res = await contract.send(transfer)
    return res
}

async function transfer(trans) {
    // [{address: string, value: number}]

    const jettonWalletAddress = Address.parse(config.ton.ADDRESS)
    const internals = []
    const hashes = []

    for (let i = 0; i < trans.length; i ++) {
        const tran = trans[i]
        const destinationAddress = Address.parse(tran.address);
        const forwardPayload = beginCell()
            .storeUint(0, 32) // 0 opcode means we have a comment
            .storeStringTail(stringRandom(8))
            .endCell();
        const messageBody = beginCell()
            .storeUint(0x0f8a7ea5, 32) // opcode for jetton transfer
            .storeUint(0, 64) // query id
            .storeCoins(toNano(tran.value / 1000)) // jetton amount, amount * 10^9
            .storeAddress(destinationAddress)
            .storeAddress(destinationAddress) // response destination
            .storeBit(0) // no custom payload
            .storeCoins(0) // forward amount - if >0, will send notification message
            .storeBit(1) // we store forwardPayload as a reference
            .storeRef(forwardPayload)
            .endCell();
        hashes.push(messageBody.hash().toString('hex'))
        const internalMessage = internal({
            to: jettonWalletAddress,
            value: toNano('0.05'),
            bounce: true,
            body: messageBody
        });
        internals.push(internalMessage)
    }

    await send(internals)
    return hashes
}

async function checkTransactions(hashes,limit) {
    const transactions = await client.getTransactions(config.ton.ADDRESS, {
        limit: limit//hashes.length,
    });
    const bodyHashes = []
    const results = []
    for (let tx of transactions) {
        if (tx.description.aborted) {
            continue
        }
        const originalBody = tx.inMessage.body.beginParse();
        let body = originalBody.clone();
        if (body.remainingBits < 32) {
            continue
        } else {
            const op = body.loadUint(32);
            if (op != 0x0f8a7ea5) {
                continue
            }
        }
        const bodyHash = tx.inMessage.body.hash().toString('hex')
        bodyHashes.push(bodyHash)
    }
    for (let i = 0; i < hashes.length; i ++) {
        results.push(bodyHashes.includes(hashes[i]))
    }
    return results
}

module.exports = {
    transfer,
    checkTransactions
}

import fetch from 'node-fetch';
export class Indexer {
    // get utxos
    // get utxos for an address
    async getUtxos(address) {
        const url = `https://api.whatsonchain.com/v1/bsv/main/address/${address}/unspent`;
        console.log(`GETUTXOS`, url);
        const response = await fetch(url);
        return response.json();
    }
}

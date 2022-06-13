// node18 has its own fetch
//import fetch from 'node-fetch';

export class Indexer {
      // get utxos for an address
  async getUtxos(address: string) {
    const url = `https://api.whatsonchain.com/v1/bsv/main/address/${address}/unspent`;
    console.log(`GETUTXOS`, url);
    const response = await fetch(url);
    return response.json();
  }

  // broadcast hex transaction
  async broadcast(tx: Buffer | string) {
    if (Buffer.isBuffer(tx)) {
      tx = tx.toString('hex');
    }
    const url = `https://www.whatsonchain.com/v1/bsv/main/tx/raw`
    //const url = `https://api.taal.com/api/v1/broadcast`;
    console.log(`URL`, url);

    const fcreate = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        //Authorization: process.env.TAAL_APIKEY,
      },
      body: JSON.stringify({
        rawTx: tx,
      }),
    });
    const jcreate = await fcreate.text();
    let txid = jcreate; //.data
    console.log(`result`, jcreate);

    if (txid[0] === '"') {
      txid = txid.slice(1);
    }

    if (txid.slice(-1) === '\n') {
      txid = txid.slice(0, -1);
    }

    if (txid.slice(-1) === '"') {
      txid = txid.slice(0, -1);
    }

    // Check this is a valid hex string
    if (!txid.match(/^[0-9a-fA-F]{64}$/)) {
      throw new Error(`Failed to broadcast: ${txid}`);
    }

    return txid;
  }

}
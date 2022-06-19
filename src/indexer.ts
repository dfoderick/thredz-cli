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
    //const url = `https://www.whatsonchain.com/v1/bsv/main/tx/raw`
    //const url = `https://api.taal.com/api/v1/broadcast`;
    const url = `https://mapi.gorillapool.io/mapi/tx`
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
    //TODO: mapi resonse is
    // {"payload":"{\"apiVersion\":\"\",\"timestamp\":\"2022-06-18T23:06:16.352Z\",\"txid\":\"1f24a16583a65b17f74ae2be1ce1c07638fac22bafc9dbb9a71001e75f9f96ab\",\"returnResult\":\"success\",\"resultDescription\":\"\",\"minerId\":\"03ad780153c47df915b3d2e23af727c68facaca4facd5f155bf5018b979b9aeb83\",\"currentHighestBlockHash\":\"00000000000000000c8eb57a5d115ae60eabb35dbd413f89be5e640b38c0cf70\",\"currentHighestBlockHeight\":744547,\"txSecondMempoolExpiry\":0}","signature":"3045022100d8ec588b8b8934473e4e9b69ec61a015f2399fc2dc03b7fd0ff2d14184f95f380220443c353adf6c020508cc6f44cefe46bdf5c847a2b30f9e1bb4f05dede3d67ad0","publicKey":"03ad780153c47df915b3d2e23af727c68facaca4facd5f155bf5018b979b9aeb83","encoding":"UTF-8","mimetype":"application/json"}
    if (!txid.match(/^[0-9a-fA-F]{64}$/)) {
      throw new Error(`Failed to broadcast: ${txid}`);
    }

    return txid;
  }


  async history() {
    const query = {
      q: {
        find: { "out.s2": "19HxigV4QyBv3tHpQVcUEQyq1pzZVdoAut", "blk.i": { "$gt": 609000 } },
        limit: 1,
        sort: { "blk.i": 1 },
        project: { "blk": 1, "tx.h": 1, "out.s4": 1, "out.o1": 1 }
      }
    };
    const fq = await fetch("https://txo.bitbus.network/block", {
      method: "post",
      headers: { 
        'Content-type': 'application/json; charset=utf-8',
        token: process.env.UNWRITER_TOKEN||''
      },
      body: JSON.stringify(query)
    })
    const result = await fq.text()
    return result
  }

  async metanet(startingBlock: number = 744000) {
    const query = {
      q: {
        find: { "out.s2": "meta","out.s5": "dave", "blk.i": { "$gt": startingBlock } },
        //find: { "out.s2": "meta", "blk.i": { "$gt": startingBlock } },
        limit: 100,
        sort: { "blk.i": 1 },
        project: { "tx.h": 1, "out.s3": 1, "out.s4": 1, "out.s5": 1 }
//        project: { "blk": 1, "tx.h": 1, "out.s4": 1, "out.o1": 1 }
      }
    };
    const fq = await fetch("https://txo.bitbus.network/block", {
      method: "post",
      headers: { 
        'Content-type': 'application/json; charset=utf-8',
        token: process.env.UNWRITER_TOKEN||''
      },
      body: JSON.stringify(query)
    })
    const result = await fq.text()
    return result
  }


}
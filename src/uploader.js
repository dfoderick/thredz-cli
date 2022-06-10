import OpenSPV from 'openspv';
import * as fs from "fs";
import { MetaNode } from "./meta.js";
import constants from "./constants.js";
import { IndexingService } from 'moneystream-wallet';
import { Wallet as msWallet } from 'moneystream-wallet';
import { WalletStorage } from "./walletstorage.js";
import Long from "long";
export class Uploader {
    constructor(wallet, folder) {
        this.bProtocolTag = '19HxigV4QyBv3tHpQVcUEQyq1pzZVdoAut';
        this.dipProtocolTag = '1D1PdbxVxcjfovTATC3ginxjj4enTgxLyY';
        this.algorithm = 'SHA512';
        this.wallet = wallet;
        this.folder = folder;
    }
    async prepare(fileName) {
        if (!fs.existsSync(fileName))
            return { success: false, result: `File does not exists` };
        const content = fs.readFileSync(fileName);
        const build = await this.makeTransaction(fileName, content);
        return { success: false, result: build };
    }
    //TODO:
    async makeTransaction(fileName, content) {
        console.log(`content`, content.length);
        //TODO: test encrypt and decrypt
        //console.log(`pubkey`, this.wallet.PublicKey)
        const encContent = OpenSPV.Ecies.bitcoreEncrypt(content, this.wallet.PublicKeyMeta);
        console.log(`content encrypted`, encContent.length);
        const node = new MetaNode();
        node.name = fileName;
        node.content = content;
        if (content.length > constants.MAX_BYTES_PER_TRANSACTION) {
            throw new Error(`FILE SIZE TOO BIG. USE BCAT`);
        }
        let build = ``;
        const test = true;
        if (test) {
            const script = this.metaScript(null, node);
            node.script = script;
            const metanetTransaction = await this.createTransaction(node);
            build = metanetTransaction.toString();
            if (script)
                this.folder.commit(build);
        }
        else {
            this.folder.commit(Buffer.from(`TODO: this will be a transation\n`));
        }
        return { build: build };
    }
    async testSpend(payTo) {
        var _a;
        const indexService = new IndexingService();
        const msw = new msWallet(new WalletStorage(), indexService);
        const wif = (_a = this.wallet.PrivateKeyFundingDerived) === null || _a === void 0 ? void 0 : _a.toWif();
        //const wif = this.wallet.PrivateKeyLegacy?.toWif()
        console.log(`wif`, wif);
        msw.loadWallet(wif);
        console.log(msw._keypair.toAddress().toString());
        //await msw.tryLoadWalletUtxos()
        const utxos = await msw.loadUnspent();
        //console.log(msw._selectedUtxos)
        console.log(`balance`, msw.balance);
        const fee = 10;
        const buildResult = await msw.makeSimpleSpend(Long.fromNumber(msw.balance - fee), undefined, payTo);
        console.log(`build`, buildResult);
        //const broadcastResult = await indexService.broadcastRaw(buildResult.hex)
        //console.log(`broadcast`,broadcastResult)
    }
    getMoneyStreamWallet() {
        var _a;
        const indexService = new IndexingService();
        const msw = new msWallet(new WalletStorage(), indexService);
        const wif = (_a = this.wallet.PrivateKeyFundingDerived) === null || _a === void 0 ? void 0 : _a.toWif();
        msw.loadWallet(wif);
        msw.logDetails();
        return msw;
    }
    //TODO: create the transaction
    async createTransaction(node) {
        //await this.wallet.getBalance()
        const msw = this.getMoneyStreamWallet();
        //this.wallet.PrivateKey.toWif()
        //const mskey = `L5NDEVBUT51jQbSTKbzrmKALTEgSR8evvkHen4QVcRVsYgnp5xSo`
        await msw.tryLoadWalletUtxos();
        if (msw.balance === 0) {
            throw new Error(`No funds available`);
        }
        // const builder = new TransactionBuilder()
        // from utxos
        //const utxo = this.wallet.utxos[0]
        const utxo = {
            height: 742946,
            tx_pos: 0,
            tx_hash: '8a63d5ca3e3b56a745105960006a3866742695319cb3b888396f7f8f7d475bb5',
            value: 17424
        };
        // console.log(`UTXO`, utxo)
        return 'TODO';
    }
    // build script for child node
    metaScript(parent, child) {
        //const digest = OpenSPV.Hash.sha512(child.content)
        const encoding = ' ';
        const mediaType = ' ';
        //   OP_RETURN
        //   19HxigV4QyBv3tHpQVcUEQyq1pzZVdoAut
        //   [Data]
        //   [Media Type]
        //   [Encoding]
        //   [Filename]
        const opr = [
            this.metaPreamble(parent, child),
            this.bProtocolTag,
            child.content,
            mediaType,
            encoding,
            child.name,
            // '|',
            // this.dipProtocolTag,
            // this.algorithm,
            // digest,
            // 0x01,
            // 0x05
        ];
        return ['OP_RETURN', this.asHex(opr)];
    }
    metaPreamble(parent, child) {
        var _a, _b;
        const derivedKey = (_b = (_a = this.wallet) === null || _a === void 0 ? void 0 : _a.keyMeta) === null || _b === void 0 ? void 0 : _b.deriveChild(child.keyPath);
        //console.log(`DERIVED`,derivedKey)
        return [constants.META_PROTOCOL, derivedKey === null || derivedKey === void 0 ? void 0 : derivedKey.Address.toString(), parent === null ? 'NULL' : parent.transactionId];
    }
    asHex(arr) {
        return arr.map((a) => {
            if (a instanceof Buffer)
                return a.toString('hex');
            if (typeof a === 'number') {
                if (a < 16)
                    return a.toString(16).padStart(2, '0');
                throw Error(`FIX ASHEX ${a}`);
            }
            return Buffer.from(a.toString('hex'));
        });
    }
}

import { KeyPair } from "./key.js";
import * as fs from "fs";
import constants from "./constants.js";
import { Indexer } from "./indexer.js";
export class Wallet {
    constructor() {
        this.indexer = new Indexer();
        this.key = null;
        this.user = '';
        this.utxos = [];
    }
    get Address() { var _a; return (_a = this.key) === null || _a === void 0 ? void 0 : _a.Address; }
    get PublicKey() { var _a; return (_a = this.key) === null || _a === void 0 ? void 0 : _a.PublicKey; }
    async getBalance() {
        const utxo = await this.indexer.getUtxos(this.Address);
        this.utxos = utxo;
        console.log(this.utxos);
        const bal = this.utxos.reduce(function (sum, utxo) {
            return sum + utxo.value;
        }, 0);
        return bal;
    }
    writeWallet(fileName) {
        const useFile = fileName || constants.WALLET_FILE_NAME;
        if (!this.key)
            throw new Error(`assign a key before saving wallet file`);
        fs.writeFileSync(useFile, JSON.stringify({
            key: this.key.toString(),
            user: this.user
        }));
    }
    static fromFile(fileName) {
        const useFile = fileName || constants.WALLET_FILE_NAME;
        const w = new Wallet();
        if (!fs.existsSync(useFile)) {
            w.key = KeyPair.fromRandom();
            w.writeWallet(useFile);
            console.info(`Created file ${useFile} with key for user ${w.user}`);
        }
        else {
            const swallet = fs.readFileSync(useFile);
            w.load(swallet.toString());
        }
        //console.log(`w.key`, w.key)
        return w;
    }
    load(walletContents) {
        if (!walletContents) {
            return Wallet.fromFile();
        }
        const jwallet = JSON.parse(walletContents);
        const setkey = KeyPair.fromString(jwallet.key);
        this.key = setkey;
        this.user = jwallet.user;
        return this;
    }
}

import { KeyPair } from "./key.js";
import * as fs from "fs";
import constants from "./constants.js";
import { Indexer } from "./indexer.js";

export class Wallet {
    indexer: Indexer = new Indexer()
    key: KeyPair | null = null
    user: string = ''
    utxos: any = []

    get Address() { return this.key?.Address }
    get PublicKey() { return this.key?.PublicKey }

    async getBalance() {
        const utxo = await this.indexer.getUtxos(this.Address)
        this.utxos = utxo
        console.log(this.utxos)
        const bal = this.utxos.reduce(function (sum:number, utxo:any) {
            return sum + utxo.value;
        }, 0);
        return bal
    }

    writeWallet(fileName?: string) {
        const useFile = fileName || constants.WALLET_FILE_NAME
        if (!this.key) throw new Error(`assign a key before saving wallet file`)
        fs.writeFileSync(useFile, JSON.stringify({
            key: this.key.toString(),
            user: this.user
        }))
    }

    static fromFile(fileName?:string) : Wallet {
        const useFile = fileName || constants.WALLET_FILE_NAME
        const w = new Wallet()
        if (!fs.existsSync(useFile)) {
            w.key = KeyPair.fromRandom();
            w.writeWallet(useFile)
            console.info(`Created file ${useFile} with key for user ${w.user}`)
        } else {
            const swallet = fs.readFileSync(useFile)
            w.load(swallet.toString())
        }
        //console.log(`w.key`, w.key)
        return w
    }

    load(walletContents?: string) {
        if (!walletContents) {
            return Wallet.fromFile()
        }
        const jwallet = JSON.parse(walletContents)
        const setkey = KeyPair.fromString(jwallet.key)
        this.key = setkey
        this.user = jwallet.user
        return this
    }
}
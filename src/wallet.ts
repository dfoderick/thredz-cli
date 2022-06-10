import OpenSPV from 'openspv';
import { KeyPair } from "./key.js";
import * as fs from "fs";
import constants from "./constants.js";
import { Indexer } from "./indexer.js";

export class Wallet {
    indexer: Indexer = new Indexer()
    // this is the master key for metanet owner
    keyMeta: KeyPair | null = null
    // this is the funding key for transaction purse
    keyFunding: KeyPair | null = null
    user: string = ''
    utxos: any = []

    // this is the unused funding that needs to be reversed
    //https://whatsonchain.com/tx/8a63d5ca3e3b56a745105960006a3866742695319cb3b888396f7f8f7d475bb5
    //1GBf5G37sX6cGBrRHjSeSCdZJJWEC7N3bW
    get AddressLegacy() { 
        //console.log(`LEGACY`, this.keyMeta?.toString())
        //return this.keyMeta?.Address
        return `1GBf5G37sX6cGBrRHjSeSCdZJJWEC7N3bW`
    }

    // Address for writing to metanet
    get AddressMeta() { return this.keyMeta?.Address }
    get PublicKeyMeta() { return this.keyMeta?.PublicKey }
    get PrivateKeyMeta() { return this.keyMeta?.PrivateKey }

    get PrivateKeyLegacy() /*: OpenSPV.PrivKey*/ { 
        const privk = this.PrivateKeyMeta
        //return privk?.derive(constants.FUNDING_DERIVATION_PATH)
        return privk
    }

    // private key used for funding
    get KeyPairFundingDerived(): KeyPair | undefined { 
        const privk = this.keyFunding
        return privk?.derive(constants.FUNDING_DERIVATION_PATH)
    }
    get PrivateKeyFundingDerived() /*: OpenSPV.PrivKey*/ { 
        return this.KeyPairFundingDerived?.PrivateKey
    }
    // Address for funding transactions. purse
    get AddressFunding() {
        //console.log(this.PrivateKeyFundingDerived)
        const address = OpenSPV.Address.fromPrivKey(this.PrivateKeyFundingDerived)
        return address
    }

    async getBalance(address?:string) {
        // was this.Address
        const utxo = await this.indexer.getUtxos(address || this.AddressFunding)
        this.utxos = utxo
        console.log(this.utxos)
        const bal = this.utxos.reduce(function (sum:number, utxo:any) {
            return sum + utxo.value;
        }, 0);
        return bal
    }

    writeWallet(fileName?: string) {
        const useFile = fileName || constants.WALLET_FILE_NAME
        if (!this.keyMeta) throw new Error(`assign a Meta key before saving wallet file`)
        if (!this.keyFunding) throw new Error(`assign a Funding key before saving wallet file`)
        fs.writeFileSync(useFile, JSON.stringify({
            keymeta: this.keyMeta.toString(),
            keyfunding: this.keyFunding?.toString(),
            user: this.user
        }))
    }

    static fromFile(fileName?:string) : Wallet {
        const useFile = fileName || constants.WALLET_FILE_NAME
        const w = new Wallet()
        if (!fs.existsSync(useFile)) {
            w.keyMeta = KeyPair.fromRandom();
            w.keyFunding = KeyPair.fromRandom();
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
        const setkey = KeyPair.fromString(jwallet.keymeta || jwallet.key)
        this.keyMeta = setkey
        let updateWallet = false
        
        // keys were renamed
        if (!jwallet.keymeta) {
            jwallet.keymeta = jwallet.key
            updateWallet = true
        }
        if (!jwallet.keyfunding) {
            jwallet.keyfunding = KeyPair.fromRandom().toString()
            updateWallet = true
            console.log(`Created New Funding Key ${jwallet.keyfunding}`)
        }
        //console.log(jwallet)
        this.keyFunding = KeyPair.fromString(jwallet.keyfunding)

        this.user = jwallet.user
        if (updateWallet) {
            this.writeWallet()
        }
        return this
    }
}
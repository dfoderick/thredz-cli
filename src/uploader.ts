//    "bsv": "git+https://github.com/moneystreamdev/bsv.git",
import { Wallet } from "./wallet.js";
import { Folder } from "./folder.js"
import OpenSPV from 'openspv';
import * as fs from "fs";
import { MetaNode } from "./meta.js";
import constants from "./constants.js";
import { IndexingService, TransactionBuilder, UnspentOutput } from 'moneystream-wallet'
import {Wallet as msWallet, Script} from 'moneystream-wallet'
import { WalletStorage } from "./walletstorage.js";
import Long from "long";

const bProtocolTag = '19HxigV4QyBv3tHpQVcUEQyq1pzZVdoAut'
const dipProtocolTag = '1D1PdbxVxcjfovTATC3ginxjj4enTgxLyY'
const algorithm = 'SHA512'

export class Uploader {
    private wallet:Wallet
    private folder:Folder
    constructor(wallet: Wallet, folder: Folder) {
        this.wallet = wallet
        this.folder = folder
    }
    async prepare(fileName: string) {
        if (!fs.existsSync(fileName)) return {success: false, result:`File does not exists`}
        const content = fs.readFileSync(fileName)
        const build = await this.makeTransaction(fileName, content)
        return {success: true, result: build}
    }

    //TODO:
    async makeTransaction(fileName:string, content: Buffer) {
        console.log(`content`, content.length)
        //TODO: test encrypt and decrypt
        //console.log(`pubkey`, this.wallet.PublicKey)
        const encContent = OpenSPV.Ecies.bitcoreEncrypt(content, this.wallet.PublicKeyMeta)
        console.log(`content encrypted`, encContent.length)
        const node: MetaNode = new MetaNode()
        node.name = fileName
        // node content is encrypted content
        node.content = encContent
        if (content.length > constants.MAX_BYTES_PER_TRANSACTION) {
            throw new Error(`FILE SIZE TOO BIG. USE BCAT`)
        }

        let build = ``
        const test = true
        if (test) {
            const script = this.metaScript(null, node)
            node.script = script
            const metanetTransaction = await this.createTransaction(node)
            build = metanetTransaction.toString()
            if (script) this.folder.stageWork(build)
        } else {
            this.folder.stageWork(Buffer.from(`TODO: this will be a transation\n`))
        }
        return {build: build}
    }

    async testSpend(payTo: string) {
        const indexService = new IndexingService()
        const msw: msWallet = new msWallet(new WalletStorage(), indexService)
        const wif = this.wallet.PrivateKeyFundingDerived?.toWif()
        //const wif = this.wallet.PrivateKeyLegacy?.toWif()
        console.log(`wif`, wif)
        msw.loadWallet(wif)
        console.log(msw._keypair.toAddress().toString())
        const utxos = await msw.loadUnspent()
        console.log(`balance`,msw.balance)
        const fee = 10
        const buildResult = await msw.makeSimpleSpend(Long.fromNumber(msw.balance-fee),undefined,payTo)
        console.log(`build`, buildResult)
    }

    getMoneyStreamWallet() {
        const indexService = new IndexingService()
        const msw: msWallet = new msWallet(new WalletStorage(), indexService)
        const wif = this.wallet.PrivateKeyFundingDerived?.toWif()
        msw.loadWallet(wif)
        //msw.logDetails()
        return msw
    }

    //create a transaction for the node
    async createTransaction(node: MetaNode) {
        //await this.wallet.getBalance()
        const msw: msWallet = this.getMoneyStreamWallet()
        await msw.tryLoadWalletUtxos()
        if (msw.balance === 0) {
            throw new Error(`No funds available`)
        }
        const fee = 20000 //TODO: estimate fees
        //payTo can be script
        const payTo = Script.fromSafeDataArray(node.script) //new Script(node.script)
        console.log(`script for meta node has`, payTo.chunks.length,`chunks`)
        //data will get added if payto is a Script object
        const buildResult = await msw.makeSimpleSpend(Long.fromNumber(0),undefined,payTo,fee)
        //msw.addData
        // const buildResult = await msw.makeStreamableCashTx(Long.fromNumber(0),
        // payTo, false,undefined, undefined)
        // console.log(`build`, buildResult)
        msw.logDetailsLastTx()
        //console.log(buildResult.tx.txOuts[0])
        buildResult.tx.txOuts.forEach((o:any) => {
            this.logScript(o.script)
        })
        console.log(`media size encrypted`, node.content?.length)
        console.log(`      media size x 2`, (node.content?.length||0)*2)
        console.log(`    transaction size`, buildResult.hex.length)
        return buildResult.hex
    }
    logScript(script:any) {
        script.chunks.forEach((chunk:any) => {
            if (chunk.len) console.log(chunk.len, )
            //else console.log(chunk)
        })
    }

    // commit UOW by broadcasting changes to metanet
    async commit() {
        const commits = this.folder.getCommits()
        const committed = []
        if (commits) {
            const indexService = new IndexingService()
            for (let i =0; i< commits.length; i++) {
                // example result: 123d27dc4a5024e87178e0d6e7dee476c114d928a627a27be5ce9840ccf18a72
                const broadcastResult = await indexService.broadcastRaw(commits[i].hex)
                console.log(`broadcast`,broadcastResult)
                // if broadcast success then mark this commit and store the txn
                commits[i].broadcast = broadcastResult
                this.folder.storeTransaction(commits[i])
                committed.push(commits[i])
            }
        }
        //store the updated commits
        this.folder.saveCommits(commits)
        return committed
    }

    // build script for child node
    metaScript(parent: MetaNode|null, child: MetaNode) {
        //const digest = OpenSPV.Hash.sha512(child.content)
        const encoding = ' '
        const mediaType = ' '
        //   OP_RETURN
        //   19HxigV4QyBv3tHpQVcUEQyq1pzZVdoAut
        //   [Data]
        //   [Media Type]
        //   [Encoding]
        //   [Filename]
        // array elements should be buffer, string or number
        const opr: any[] = [
            ...this.metaPreamble(parent, child),
            bProtocolTag,
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
        ]
        return this.asHexBuffers(opr)
    }

    // metanet protocol scripts
    metaPreamble(parent: MetaNode|null, child: MetaNode): string[] {
        const derivedKey = this.wallet?.keyMeta?.deriveChild(child.keyPath)
        //console.log(`DERIVED`,derivedKey)
        if (!derivedKey?.Address) throw new Error(`METAnet protocol rerquire address ${derivedKey?.Address}`)
        return [
            constants.META_PROTOCOL, 
            derivedKey?.Address.toString(),
            parent === null ? 'NULL' : parent.transactionId
        ]
    }
    // returns script data as array of hex buffers that Script wants
    asHexBuffers(arr:any[]): Buffer[] {
        return arr.map((a: any) => {
            if (a instanceof Buffer) return a //Buffer.from(a.toString('hex'))
            if (typeof a === 'number') {
                if (a < 16 ) return Buffer.from(a.toString(16).padStart(2,'0'))
                throw Error(`FIX ASHEX ${a}`)
            }
            return Buffer.from(a.toString('hex'))
        })
    }
}
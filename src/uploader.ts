//    "bsv": "git+https://github.com/moneystreamdev/bsv.git",
import { Wallet } from "./wallet";
import { Folder } from "./folder"
import OpenSPV from 'openspv';
import * as fs from "fs-extra";
import { MetaNode, ContentNode } from "./models/meta";
import constants from "./constants";
import { IndexingService, TransactionBuilder, UnspentOutput } from 'moneystream-wallet'
import {Wallet as msWallet, Script} from 'moneystream-wallet'
import { WalletStorage } from "./walletstorage";
import Long from "long";
import { Indexer } from "./indexer";

const dipProtocolTag = '1D1PdbxVxcjfovTATC3ginxjj4enTgxLyY'
const algorithm = 'SHA512'

//https://bcat.bico.media/
const bcatProtocolTag = '15DHFxWZJT58f9nhyGnsRBqrgwK4W6h4Up'

//TODO: its more than an uploader. Its a general node processor
// create media and text nodes and other types of nodes
export class Uploader {
    private wallet:Wallet
    private folder:Folder
    public fee:number = 100
    //use this to send transaction
    indexer: Indexer = new Indexer()
    //obsolete
    indexService: IndexingService = new IndexingService()
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

    //make media node
    async makeTransaction(fileName:string, content: Buffer) {
        console.log(`content`, content.length)
        if (!this.wallet.PublicKeyMeta) throw new Error(`Wallet must be loaded!`)
        //TODO: test encrypt and decrypt
        //console.log(`pubkey`, this.wallet.PublicKey)
        const encContent = OpenSPV.Ecies.bitcoreEncrypt(content, this.wallet.PublicKeyMeta)
        console.log(`content encrypted`, encContent.length)
        const node: ContentNode = new ContentNode(fileName)
        node.parent = this.folder.currentNode
        node.nodeType = 'media'
        // node content is encrypted content
        node.content = encContent
        if (content.length > constants.MAX_BYTES_PER_TRANSACTION) {
            throw new Error(`FILE SIZE TOO BIG. USE BCAT`)
        }

        let build = ``
        const test = true
        //TODO use parent if subdirectory
        node.script = this.metaScript(node)
        const metanetNodeBuilt = await this.createTransaction(node)
        if (node.script) this.folder.stageWork(metanetNodeBuilt)
        return {build: build}
    }

    //test a simple spend
    async testSpend(payTo: string) {
        const msw: msWallet = this.getMoneyStreamWallet()
        console.log(msw._keypair.toAddress().toString())
        const utxos = await msw.loadUnspent()
        console.log(`balance`,msw.balance)
        //TODO: use an estimator based on transaction size
        let fee = this.fee
        let buildResult = await msw.makeSimpleSpend(Long.fromNumber(msw.balance),undefined,payTo,fee)
        if (buildResult.feeActual - buildResult.feeExpected> 10) {
            // if fees paid is too much then rebuild with better fee
            buildResult = await msw.makeSimpleSpend(Long.fromNumber(msw.balance),undefined,payTo, buildResult.feeExpected)
        }
        console.log(`build`, buildResult)
    }

    getMoneyStreamWallet() {
        const msw: msWallet = new msWallet(new WalletStorage(), this.indexService)
        msw.feePerKbNum = constants.FEEPERKBNUM
        const wif = this.wallet.PrivateKeyFundingDerived?.toWif()
        msw.loadWallet(wif)
        //msw.logDetails()
        return msw
    }

    //create a transaction for the node, returns the updated node
    async createTransaction(node: MetaNode) {
        //await this.wallet.getBalance()
        const msw: msWallet = this.getMoneyStreamWallet()
        await msw.tryLoadWalletUtxos()
        if (msw.balance === 0) {
            throw new Error(`No funds available`)
        }
        //TODO: use an estimator based on transaction size
        let fee = this.fee
        //payTo can be script
        const payTo = Script.fromSafeDataArray(node.script) //new Script(node.script)
        console.log(`script for meta node has`, payTo.chunks.length,`chunks`)
        //data will get added if payto is a Script object
        let buildResult = await msw.makeSimpleSpend(Long.fromNumber(0),undefined,payTo,fee)
        if (Math.abs(buildResult.feeActual - buildResult.feeExpected) > 10) {
            //msw.logDetailsLastTx()
            //TODO: find a cleaner way to unspend the wallet utxo
            msw.clear()
            await msw.tryLoadWalletUtxos()
            console.log(`fees`, buildResult.feeActual, buildResult.feeExpected)
            buildResult = await msw.makeSimpleSpend(Long.fromNumber(0),undefined,payTo,buildResult.feeExpected)
        } else {
            console.log(`skipped rebuild`, buildResult.feeActual - buildResult.feeExpected)
        }
        //msw.logDetailsLastTx()
        //console.log(buildResult.tx.txOuts[0])
        buildResult.tx.txOuts.forEach((o:any) => {
            this.logScript(o.script)
        })
        node.logDetails()
        console.log(`    transaction size`, buildResult.hex.length)
        node.transactionId = buildResult?.tx?.id().toString('hex')
        node.hex = buildResult.hex
        node.fee = buildResult.feeActual
        node.feeExpected = buildResult.feeExpected
        //todo: save additional build result info???
        return node
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
            for (let i =0; i< commits.length; i++) {
                // example result: 123d27dc4a5024e87178e0d6e7dee476c114d928a627a27be5ce9840ccf18a72
                const broadcastResult = await this.indexer.broadcast(commits[i].hex)
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
    metaScript(child: MetaNode) {
        //const digest = OpenSPV.Hash.sha512(child.content)
        //   OP_RETURN
        //   19HxigV4QyBv3tHpQVcUEQyq1pzZVdoAut
        //   [Data]
        //   [Media Type]
        //   [Encoding]
        //   [Filename]
        // array elements should be buffer, string or number
        const opr: any[] = [
            ...this.metaPreamble(child),
            ...this.thredzPreamble(child),
            // '|',
            // this.dipProtocolTag,
            // this.algorithm,
            // digest,
            // 0x01,
            // 0x05
            child.getContentScript()
        ]
        //console.log(opr)
        return this.asHexBuffers(opr)
    }

    // metanet protocol scripts
    metaPreamble(child: MetaNode): string[] {
        const derivedKey = this.wallet?.keyMeta?.deriveChild(child.keyPath)
        //console.log(`DERIVED`,derivedKey)
        if (!derivedKey?.Address) throw new Error(`METAnet protocol rerquire address ${derivedKey?.Address}`)
        if (child.parent && !child.parent.transactionId) {
            throw new Error(`Parent node must have a transactionId`)
        }
        return [
            constants.META_PROTOCOL, 
            derivedKey?.Address.toString(),
            child?.parent?.transactionId || 'NULL' 
        ]
    }
        // thredz protocol scripts
        thredzPreamble(child: MetaNode): string[] {
            if (!child.nodeType) throw new Error(`Node Type missing!`)
            // thredz type(schema?)
            return [
                constants.THREDZ_PROTOCOL, 
                child.nodeType,
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
            if (a === null) throw new Error(`METANET script element cannot be NULL`)
            return Buffer.from(a.toString('hex'))
        })
    }

    // create a content node
    async createTextNode(filename: string, contents: string) {
        // make node
        const node = new ContentNode(filename)
        node.parent = this.folder.currentNode
        //TODO: encrypt or not?
        node.content = Buffer.from(contents)
        // store the transaction
        const built = await this.buildAndStage(node)
        //console.log(`NODE`, node)
        return built
    }

    async buildAndStage(node:MetaNode) {
        node.script = this.metaScript(node)
        const metanetNodeBuilt = await this.createTransaction(node)
        if (node.script) this.folder.stageWork(metanetNodeBuilt)
        return metanetNodeBuilt
    }

}
//    "bsv": "git+https://github.com/moneystreamdev/bsv.git",
import { Folder } from "./folder"
//import OpenSPV from 'openspv';
import * as fs from "fs-extra";
//import { BNode, MetaNode, ThredzContent } from "thredz-lib/src/models/meta";
import { Wallet } from "./wallet"
import * as thredz from "thredz-lib"
import constants from "./constants";
import { IndexingService, OutputCollection, TransactionBuilder, UnspentOutput } from 'moneystream-wallet'
import {Wallet as msWallet, Script} from 'moneystream-wallet'
import { WalletStorage } from "./walletstorage";
import Long from "long";
import { Indexer } from "./indexer";

const dipProtocolTag = '1D1PdbxVxcjfovTATC3ginxjj4enTgxLyY'
const algorithm = 'SHA512'

//TODO: its more than an uploader. Its a general node processor
// create media and text nodes and other types of nodes
export class Uploader {
    private wallet: Wallet
    private folder: Folder
    public fee:number = 100
    //use this to send transaction
    indexer: Indexer = new Indexer()
    //obsolete
    indexService: IndexingService = new IndexingService()
    constructor(wallet: Wallet, folder: Folder) {
        this.wallet = wallet
        this.folder = folder
    }

    // this will create nodes and stage transactions
    async prepare(fileName: string) {
        if (!fs.existsSync(fileName)) return {success: false, result:`File does not exists`}
        const content = fs.readFileSync(fileName)
        const build = await this.makeTransaction(fileName, content)
        return {success: true, result: build}
    }

    //make content node
    async makeTransaction(fileName:string, content: Buffer): Promise<any> {
        console.log(`content`, content.length)
        if (!this.wallet.PublicKeyMeta) throw new Error(`Wallet must be loaded!`)
        //TODO: test encrypt and decrypt
        //console.log(`pubkey`, this.wallet.PublicKey)
        //const encContent: Buffer = OpenSPV.Ecies.bitcoreEncrypt(content, this.wallet.PublicKeyMeta)
        //TODO: fix this1
        const encContent = Buffer.from(' ')
        console.log(`content encrypted`, encContent.length)
        // node is thredz content
        const node: thredz.thredz.ThredzContent = new thredz.thredz.ThredzContent(fileName)
        node.parent = this.folder.currentNode
        //TODO: sort out derived key and metanet key
        node.derivedKey = this.wallet.keyMeta
        // node content is encrypted content
        node.content = encContent
        // if content is large then it will split into parts
        node.prepareContent()
        let build = ``
        const test = true
        // navigate down the node tree and build all the scripts
        if (!node.derivedKey) throw new Error(`cannot generate script without a meta key!`)
        const msw = this.getMoneyStreamWallet()
        const utxosused:OutputCollection = new OutputCollection()
        let firstmetanetNodeBuilt:any = null
        const script = await node.generateScript(async (nodecallback:any) => {
            // console.log(`BEFORE GENERATESCRIPT CALLBACK`, nodecallback.nodeId)
            const lastnode = await this.createTransaction(nodecallback, msw, false)
            const before = utxosused.count
            if (lastnode.utxos) utxosused.addOutputs(lastnode.utxos)
            // must add only one additional utxo
            if (utxosused.count < before + 1) {
                throw new Error(`UTXO CANNOT BE SPENT TWICE!!! ${JSON.stringify(lastnode.utxos?.firstItem)}`)
            }
            // console.log(`AFTER GENERATESCRIPT CALLBACK`, nodecallback.nodeId)
            if (!firstmetanetNodeBuilt) firstmetanetNodeBuilt = lastnode
        })
        // console.log(`AFTER GENERATESCRIPT`, metanetNodeBuilt)
        node.validate()
        console.log(`utxos`, utxosused.items)
        //const metanetNodeBuilt = await this.createTransaction(node, msw)
        let commits = null
        // navigate down the node tree and stage each node
        if (node.script) commits = this.folder.stageWork(firstmetanetNodeBuilt)
        //should always create 2 or more commits. one for thredz content one for b or bcat
        return {commits: commits, node:firstmetanetNodeBuilt}
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
    //navigate node children and build those nodes too
    async createTransaction(node: thredz.thredz.MetaNode, msw?: msWallet, dochildren = true): Promise<thredz.thredz.MetaNode> {
        //await this.wallet.getBalance()
        //TODO: make this work for recursive case!!!
        if (!msw) msw = this.getMoneyStreamWallet()
        if (msw.balance === 0) {
            await msw.tryLoadWalletUtxos()
        }
        if (msw.balance === 0) {
            throw new Error(`No funds available`)
        }
        //TODO: use an estimator based on transaction size
        let fee = this.fee
        //payTo can be script
        const payTo = Script.fromSafeDataArray(node.script) //new Script(node.script)
        console.log(`script for meta node has`, payTo.chunks.length,`chunks`)
        //data will get added if payto is a Script object
        const originalbalance = msw.balance 
        //console.log(`CHANGE ADDRESS`, msw._keypair.toAddress().toString())
        let buildResult = await msw.makeSimpleSpend(Long.fromNumber(0),undefined,payTo,fee)
        if (Math.abs(buildResult.feeActual - buildResult.feeExpected) > 10) {
            //unspend the wallet utxo that are on enumbered
            msw.selectedUtxos.items.forEach((u:any) => {
                if (u.status==="hold") {
                    u.unencumber()
                    console.log(`UTXO MADE UNSPENT`)
                }
            })
            if (msw.balance < buildResult.feeExpected) throw new Error(`WALLET RAN OUT OF FUNDS. balance ${msw.balance} need ${buildResult.feeExpected}`)
            console.log(`fees`, buildResult.feeActual, buildResult.feeExpected)
            buildResult = await msw.makeSimpleSpend(Long.fromNumber(0),undefined,payTo,buildResult.feeExpected)
        } else {
            console.log(`skipped rebuild`, buildResult.feeActual - buildResult.feeExpected)
        }
        node.transactionId = buildResult?.tx?.id().toString('hex')
        console.log(`built`, node.nodeDescription)
        node.hex = buildResult.hex
        node.fee = buildResult.feeActual
        node.feeExpected = buildResult.feeExpected
        node.utxos = buildResult.utxos
        const actualFeePerKb = node.fee||1e8 / node.hex.length * 1024
        //msw.logDetailsLastTx()
        if (actualFeePerKb > constants.FEEPERKBNUM*2) {
            //throw new Error(`Paying too much for ${node.hex.length} bytes! ${actualFeePerKb} > ${constants.FEEPERKBNUM*2}`)
        } else {
            console.log(`Paid ${actualFeePerKb} (${constants.FEEPERKBNUM*2})`)
        }
        //TODO: apply spent utxo to create chain of children!
        // assumes spent index is always index 1
        
        if (node.utxos) {
            //msw.logDetailsLastTx()
            const changeUtxo = 1
            msw.spendUtxos(node.utxos, buildResult.tx, changeUtxo, node.transactionId)
            msw.selectedUtxos.items.forEach((u:any) => {
                console.log(`utxo`, u)
            })
        }

        // recursively generate for children too
        if (dochildren) {
            for (const c of node.children) {
                await this.createTransaction(c, msw)
            }
        }
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

    // // build script for child node
    // //TODO: move this to MetaNode.generateScript
    // metaScript(node: MetaNode) {
    //     //const digest = OpenSPV.Hash.sha512(child.content)
    //     //   OP_RETURN
    //     //   19HxigV4QyBv3tHpQVcUEQyq1pzZVdoAut
    //     //   [Data]
    //     //   [Media Type]
    //     //   [Encoding]
    //     //   [Filename]
    //     // array elements should be buffer, string or number
    //     const opr: any[] = [
    //         ...this.metaPreamble(node),
    //         ...this.thredzPreamble(node),
    //         // '|',
    //         // this.dipProtocolTag,
    //         // this.algorithm,
    //         // digest,
    //         // 0x01,
    //         // 0x05
    //         node.getContentScript()
    //     ]
    //     //console.log(opr)
    //     return asHexBuffers(opr)
    // }    

    // create a content node
    async createTextNode(filename: string, contents: string) {
        const node = new thredz.thredz.BNode(filename)
        node.parent = this.folder.currentNode
        //TODO: encrypt or not?
        node.content = Buffer.from(contents)
        const built = await this.buildAndStage(node)
        return built
    }

    async buildAndStage(node: thredz.thredz.MetaNode) {
        //node.script = this.metaScript(node)
        await node.generateScript()
        const metanetNodeBuilt = await this.createTransaction(node)
        if (node.script) this.folder.stageWork(metanetNodeBuilt)
        return metanetNodeBuilt
    }

}
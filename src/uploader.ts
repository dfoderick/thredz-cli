import { Wallet } from "./wallet.js";
import { Folder } from "./folder.js"
import OpenSPV from 'openspv';
import * as fs from "fs";
import { MetaNode } from "./meta.js";
import constants from "./constants.js";

export class Uploader {
    private wallet:Wallet
    private folder:Folder
    constructor(wallet: Wallet, folder: Folder) {
        this.wallet = wallet
        this.folder = folder
    }
    prepare(fileName: string) {
        if (!fs.existsSync(fileName)) return {success: false, result:`File does not exists`}
        const content = fs.readFileSync(fileName)
        const build = this.makeTransaction(fileName, content)
        return {success: false, result: build}
    }

    //TODO
    makeTransaction(fileName:string, content: Buffer) {
        console.log(`content`, content.length)
        //TODO: test encrypt and decrypt
        //console.log(`pubkey`, this.wallet.PublicKey)
        const encContent = OpenSPV.Ecies.bitcoreEncrypt(content, this.wallet.PublicKey)
        console.log(`content encrypted`, encContent.length)
        const node: MetaNode = new MetaNode()
        node.name = fileName
        node.content = content
        if (content.length > constants.MAX_BYTES_PER_TRANSACTION) {
            throw new Error(`FILE SIZE TOO BIG. USE BCAT`)
        }

        let build = ``
        const test = true
        if (test) {
            const script = this.metaScript(null, node)
            build = script.toString()
            if (script) this.folder.commit(script)
        } else {
            this.folder.commit(Buffer.from(`TODO: this will be a transation\n`))
        }
        return {build: build}
    }

    bProtocolTag = '19HxigV4QyBv3tHpQVcUEQyq1pzZVdoAut'
    dipProtocolTag = '1D1PdbxVxcjfovTATC3ginxjj4enTgxLyY'
    algorithm = 'SHA512'

    // build script for child node
    metaScript(parent: MetaNode|null, child: MetaNode) {
        const digest = OpenSPV.Hash.sha512(child.content)
        const encoding = ' '
        const mediaType = ' '
        //   OP_RETURN
        //   19HxigV4QyBv3tHpQVcUEQyq1pzZVdoAut
        //   [Data]
        //   [Media Type]
        //   [Encoding]
        //   [Filename]
        const opr: any[] = [
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
        ]
        return ['OP_RETURN', this.asHex(opr)]
    }
    metaPreamble(parent: MetaNode|null, child: MetaNode): any {
        const derivedKey = this.wallet?.key?.deriveChild(child.keyPath)
        //console.log(`DERIVED`,derivedKey)
        return [constants.META_PROTOCOL, 
        derivedKey?.Address.toString(),
        parent === null ? 'NULL' : parent.transactionId]
    }
    asHex(arr:any[]) {
        return arr.map((a: any) => {
            if (a instanceof Buffer) return a.toString('hex')
            if (typeof a === 'number') {
                if (a < 16 ) return a.toString(16).padStart(2,'0')
                throw Error(`FIX ASHEX ${a}`)
            }
            return Buffer.from(a.toString('hex'))
        })
    }
}
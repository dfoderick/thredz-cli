import { OutputCollection } from 'moneystream-wallet'
import constants from '../constants'
import { KeyPair } from '../key'
import { asHexBuffers, asHexStrings, chunkBuffer, chunkSubstr } from '../utils'

export enum NodeType {
    Thredz = 'thredz',
    Container = 'container',
    Content = 'content'
}

// a metanet node
// an in-memory graph of notes will be maintained by app
// serialized to local file or database
export abstract class MetaNode {
    // the parent owner node, null if root domain
    private _parent: MetaNode|null =  null
    // node type. container or content //folder, file, schema, script
    nodeType: NodeType = NodeType.Thredz
    //TODO: link to the previous version of this MetanetNode
    previousVersion: MetaNode|null = null
    // name of node contents, should be unique in folder, like a file name
    name: string = ''
    // location of node within hd key structure. experiment with saving keypath onchain
    //TODO: use a hierarchy
    keyPath: string = constants.META_DERIVATION_PATH
    //TODO: calculate derived key
    // Metanet key only needs to be set on root. children will find it
    derivedKey: KeyPair|null = null
    // script chunks that will be written to the transaction
    script: Buffer[] = []
    // child nodes
    children: MetaNode[] = []

    // transaction where code is stored in metanet
    transactionId: string = ''
    // built hex for the transaction
    hex: string = ''
    fee?: number
    // expected fee based on transaction size. should be close to fee
    feeExpected?: number
    utxos?: OutputCollection 
    isPersisted = false

    constructor(name:string) {
        this.name = name
    }

    get parent(): MetaNode|null { return this._parent}
    set parent(val: MetaNode|null) {
        this._parent = val
        if (this._parent) {
            this._parent.addChild(this)
        }
    }

    // the NodeId for referencing the unique node
    // TODO: should be pubkey + txid?
    get nodeId(): string {
        if (this.transactionId) return this.transactionId
        return ''
    }
    isEqual(another: any) {
        return another.name === this.name
    }
    get nodeDescription(): string {
        return `${this.nodeType}@${this.derivedKey?.Address.toString()||'UNK'}[${this.nodeId}]`
    }
    addChild(child: MetaNode) {
        if (!child) return false
        //TODO: make sure node is not already in the children!!!
        //i.e. identity map
        //if (child.parent) throw new Error(`addChild: parent is already set!!!`)
        if (!child.parent || child.parent["name"] !== this.name) child.parent = this
        // for now lookup by name
        const found = this.children.find(c => {if (c.isEqual(this)) return c})
        if (!found) this.children.push(child)
    }

    // get metanet key controlling this branch of nodes
    getMetanetKeyInBranch(): KeyPair|null|undefined {
        if (this.derivedKey) return this.derivedKey
        return this._parent?.getMetanetKeyInBranch()
    }

    // exclude duplicate data. only include properties to store
    toPersistent() {
        //TODO: figure out if already persisted
        if (this.isPersisted) return null
        return {
            parent: this.parent?.nodeId,
            id: this.nodeId,
            name:this.name, 
            nodeType:this.nodeType, 
            keyPath: this.keyPath, 
            transactionId: this.transactionId,
            script: this.hex ? `array of ${this.script.length}` : asHexStrings(this.script),
            //TODO: will this cause out of memory???
            //script: asHexStrings(this.script),
            hex: this.hex,
            fee: this.fee,
            feeExpected: this.feeExpected
        }
    }

    getUnsavedAndChildren(): any[] {
        let results: any[] = []
        const me = this.toPersistent()
        if (me) results.push(me)
        this.children?.forEach(c => {
            const p = c.getUnsavedAndChildren()
            if (p) results = results.concat(p)
        })
        return results
    }

    getContentScript(): (string|Buffer)[] {
        this.script = [Buffer.from(this.name)]
        return this.script
    }
    logDetails() { 
        console.log(this.constructor.name, this.nodeId, this.name, this.nodeType )
        console.log(this.script)
        this.children?.forEach(c => c.logDetails())
    }

    async generateScript(afterScriptCallback?: any) {
        //const digest = OpenSPV.Hash.sha512(child.content)
        //   OP_RETURN
        //   19HxigV4QyBv3tHpQVcUEQyq1pzZVdoAut
        //   [Data]
        //   [Media Type]
        //   [Encoding]
        //   [Filename]
        // array elements should be buffer, string or number
        const opr: any[] = [
            ...this.metaPreamble(),
            //TODO: only if thredz node
            ...this.thredzPreamble(),
            // '|',
            // this.dipProtocolTag,
            // this.algorithm,
            // digest,
            // 0x01,
            // 0x05
        ]
        opr.push(this.getContentScript())
        this.script = asHexBuffers(opr)
        if (afterScriptCallback) await afterScriptCallback(this)
        for (const c of this.children) {
            await c.generateScript(afterScriptCallback)
        }
        return this.script
    }

    // metanet protocol scripts
    metaPreamble(): string[] {
        // const derivedKey = this.wallet?.keyMeta?.deriveChild(child.keyPath)
        // //console.log(`DERIVED`,derivedKey)
        // if (!derivedKey?.Address) throw new Error(`METAnet protocol rerquire address ${derivedKey?.Address}`)
        if (this.parent && !this.parent.transactionId) {
            console.log(`LOGGING BEFORE ERROR`)
            this.parent.logDetails()
            throw new Error(`Parent node must have a transactionId (${this.nodeDescription})`)
        }
        const metaKey = this.getMetanetKeyInBranch()
        if (!metaKey) throw new Error(`node ${this.nodeDescription} has no Metanet Key in branch!`)
        return [
            constants.META_PROTOCOL, 
            metaKey.Address.toString('hex'),
            // parent.transactionid has to be in proper endian!!!
            this.parent?.transactionId || 'NULL' 
        ]
    }
    // thredz protocol scripts
    // TODO: should be on thredz type
    thredzPreamble(): string[] {
        if (!this.nodeType) throw new Error(`Node Type missing!`)
        // thredz type(schema?)
        return [
            constants.THREDZ_PROTOCOL, 
            this.nodeType,
            this.keyPath
        ]
    }

    // validate that metanet strucutre is correct
    validate() {
        if (!this.nodeId) throw new Error(`MetaNode must have a nodeId`)
        if (!this.hex) throw new Error(`MetaNode must have a transaction hex`)
        if (this.parent) {
            if (!this.parent.nodeId) throw new Error(`MetaNode parent must have nodeId`)
            if (!this.parent.hex) throw new Error(`MetaNode parent must have hex`)
        }
        this.children.forEach(c => {
            c.validate()
        })
    }
}

// type of thredz nodes
enum ThredzType {
    // a folder is an alias for a container. same concept
    Folder = "container",
    Container = "container",
    // a file is an alias for content. same concept
    File = "content",
    Content = "content",
    Script = "script",
  }

// base node for all threads nodes
export abstract class ThredzNode extends MetaNode {
    public thredzType: ThredzType = ThredzType.Container
    get nodeDescription(): string {
        return `${this.nodeType}:${this.thredzType}[${this.nodeId}]`
    }
    logDetails() {
        console.log(this.constructor.name, this.nodeId, this.name, this.nodeType, this.thredzType ) 
        this.children?.forEach(c => c.logDetails())
    }
    toPersistent() {
        const sup = super.toPersistent()
        if (!sup) return sup
        return {...sup, thredzType: this.thredzType}
    }
    thredzPreamble(): string[] {
        if (!this.nodeType) throw new Error(`Node Type missing!`)
        // thredz type(schema?)
        return [
            constants.THREDZ_PROTOCOL, 
            this.thredzType.toString(),
            this.keyPath
        ]
    }

}

export class ThredzContainer extends ThredzNode {
    constructor(name:string) {
        super(name)
        this.thredzType = ThredzType.Container
    }
    static fromJson(j:any) {
        const t = new ThredzContainer(j.name)
        t.transactionId = j.transactionId
        return t
    }
    logDetails() {
        console.log(this.constructor.name, this.nodeId, this.name, this.nodeType, this.thredzType ) 
        this.children?.forEach(c => c.logDetails())
    }
}

export class ThredzContent extends ThredzNode {
    // full content if all content fits in node
    content: Buffer | null = null
    constructor(name:string) {
        super(name)
        this.thredzType = ThredzType.Content
    }
    logDetails() {
        console.log(this.constructor.name, this.nodeId, this.name, this.nodeType, this.thredzType ) 
        this.children?.forEach(c => c.logDetails())
    }
    prepareContent() {
        if (!this.content) return
        if (this.content.length > constants.MAX_BYTES_PER_TRANSACTION) {
            //throw new Error(`FILE SIZE TOO BIG. USE BCAT`)
            const bcat = new BcatNode(this.name)
            this.addChild(bcat)
            // explode the node into bcat parts subnodes here
            bcat.contentChunks = chunkBuffer(this.content, constants.MAX_BYTES_PER_TRANSACTION)
            console.log(`chunks`, bcat.contentChunks)
            for (let i =0; i< bcat.contentChunks.length; i++) {
                const child = new BNode(this.name)
                child.partNumber = i
                child.content = bcat.contentChunks[i]
                bcat.addChild(child)
            }
    
// The 15DHFxWZJT58f9nhyGnsRBqrgwK4W6h4Up bitcom namespace must have 7 or more arguments to be valid:

// A string providing any unstructured info the sender finds relevant to share about how the Bcat transaction came to life. No longer than 128 characters (can be an empty string in the transaction data - but please be aware that some frameworks for BSV to create and broadcast transactions will treat an empty string as no data and then not provide any string)

// A string providing the MIME type of the content of the file. No longer than 128 characters

// A string providing the charset/encoding of the file. No longer than 16 characters (can be NULL[1])

// A string providing the name of the file. No longer than 256 characters (can be NULL[1])

// A string providing a flag indicating how to treat data. No longer than 16 characters (can be NULL[1])

// 32 bytes representing the bytes of the hash of the transaction with the first part of data of the file (TX1).

// 32 bytes representing the bytes of the hash of the transaction with the second part of data of the file (TX2)

// Any number of arguments can follow providing a sequence of transaction IDs (TXn) in the order of how data is to be represented in the file. To be a valid Bcat transaction all transaction IDs (TX1, TX2, ... TXn) must be unique, unless using the creative flag.

        } else {
            //console.log(`CONTENT LENGTH`, this.content.length)
            const child = new BNode(this.name)
            child.partNumber = 1
            this.addChild(child)
        }
        // this.logDetails()
    }
    // A threadz content is (usually) a parent pointer to a b or bcat content txn
    // it will not hold content itself
    // getContentScript() {
    //     return []
    //     // const result = super.getContentScript()
    //     // this.children.forEach(c => c.getContentScript())
    //     // return result
    // }
    async generateScript(afterScriptCallback?: any) {
        const opr: any[] = [
            ...this.metaPreamble(),
            //TODO: only if thredz node
            ...this.thredzPreamble(),
        ]
        //opr.push(this.getContentScript())
        this.script = asHexBuffers(opr)
        if (afterScriptCallback) await afterScriptCallback(this)
        for (const c of this.children) {
            // TODO: parents need to have transaction generatred before children!!!
            await c.generateScript(afterScriptCallback)
        }
        return this.script
    }
}


// similar to bcat node
export class BcatNode extends MetaNode {
    // chunked content
    contentChunks: Buffer[] | null = null
    constructor(name:string) {
        super(name)
        this.nodeType = NodeType.Container
    }
    logDetails() {
        console.log(this.constructor.name, this.nodeId, this.name, this.nodeType ) 
        this.children?.forEach(c => c.logDetails())
    }
    addChild(child: BNode) {
        if (!child) return false
        //TODO: make sure node is not already in the children!!!
        //i.e. identity map
        //if (child.parent) throw new Error(`addChild: parent is already set!!!`)
        if (!child.parent || child.parent["name"] !== this.name) child.parent = this
        // for now lookup by name
        const found = this.children.find(c => {if (c.isEqual(child)) return c})
        if (!found) this.children.push(child)
        //console.log(`addChild`, found)
    }
}

// similar to b node
export class BNode extends MetaNode {
    // full content if all content in node
    content: Buffer | null = null
    partNumber: number = 0
    constructor(name:string) {
        super(name)
        this.nodeType = NodeType.Content
    }
    isEqual(another: any) {
        if (another instanceof BNode) {
            return (another.name === this.name && another.partNumber === this.partNumber)
        }
        if (another instanceof MetaNode) return super.isEqual(another)
        return false
    }
    getContentScript() {
        //TODO: set encoding and mediaType
        const encoding = ' '
        const mediaType = ' '

        if (this.content) {
        return [
                constants.bProtocolTag,
                this.content,
                mediaType,
                encoding,
                this.name,
            ]
        } else {
            return [this.name,]
        }
    }
    logDetails() {
        console.log(this.constructor.name, `Part ${this.partNumber}`, this.nodeId, this.name, this.nodeType ) 
        if (this.content) {
            console.log(`media size encrypted`, this.content?.length)
            console.log(`      media size x 2`, (this.content?.length||0)*2)
        }
        this.children?.forEach(c => c.logDetails())
    }
}


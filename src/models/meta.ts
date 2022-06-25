import constants from '../constants'

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
    parent: MetaNode|null =  null
    // node type. container or content //folder, file, schema, script
    nodeType: NodeType = NodeType.Thredz
    //TODO: link to the previous version of this MetanetNode
    previousVersion: MetaNode|null = null
    // name of node contents, should be unique in folder, like a file name
    name: string = ''
    // location of node within hd key structure. experiment with saving onchain
    keyPath: string = constants.META_DERIVATION_PATH
    // script chunks that will be written to the transaction
    script: any[] = []
    // child nodes
    children: MetaNode[] = []

    // transaction where code is stored in metanet
    transactionId: string = ''
    // built hex for the transaction
    hex: string = ''
    fee?: number
    // expected fee based on transaction size. should be close to fee
    feeExpected?: number

    constructor(name:string) {
        this.name = name
    }
    addChild(node: MetaNode) {this.children.push(node)}

    getContentScript(): (string|Buffer)[] {
        this.script = [this.name,]
        return this.script
    }
    logDetails() {}

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

// abstract thredz node
export abstract class ThredzNode extends MetaNode {
    public thredzType: ThredzType|null = null
}

export class ThredzContainer extends ThredzNode {
    constructor(name:string) {
        super(name)
        this.thredzType = ThredzType.Container
    }
}

export class ThredzContent extends ThredzNode {
    // full content if all content in node
    content: Buffer | null = null
    constructor(name:string) {
        super(name)
        this.thredzType = ThredzType.Content
    }
    prepareContent() {
        if (!this.content) return
        if (this.content.length > constants.MAX_BYTES_PER_TRANSACTION) {
            //throw new Error(`FILE SIZE TOO BIG. USE BCAT`)
            //TODO: explode the node into subnodes here
            const bcat = new BcatNode(this.name)
            this.addChild(bcat)

        } else {
            const child = new BNode(this.name)
            this.addChild(child)
        }
    }
    getContentScript() {
        const result = super.getContentScript()
        this.children.forEach(c => c.getContentScript())
        return result
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
}

// similar to b node
export class BNode extends MetaNode {
    // full content if all content in node
    content: Buffer | null = null
    constructor(name:string) {
        super(name)
        this.nodeType = NodeType.Content
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
        if (this.content) {
            console.log(`media size encrypted`, this.content?.length)
            console.log(`      media size x 2`, (this.content?.length||0)*2)
        }
    }
}



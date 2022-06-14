import constants from '../constants'

// a metanet node
// an in-memory graph of notes will be maintained by app
// serialized to local file or database
export class MetaNode {
    // the parent owner node, null if root domain
    parent: MetaNode | null = null
    // name of node contents, should be unique in folder, like a file name
    name: string = ''
    // node contents can be name of directory or file
    content: Buffer | null = null
    // location of node within hd key structure. experiment with saving onchain
    keyPath: string = constants.META_DERIVATION_PATH
    // script chunks that will be written to the transaction
    script: any[] = []
    // transaction where code is stored in metanet
    transactionId: string = ''
    // child nodes
    children: MetaNode[] = []

    // built hex for the transaction
    hex: string = ''

    constructor(name:string) {
        this.name = name
    }
}
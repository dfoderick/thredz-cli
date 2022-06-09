import constants from './constants.js';
// a metanet node
// an in-memory graph of notes will be maintained by app
// serialized to local file or database
export class MetaNode {
    constructor() {
        // the parent owner node, null if root domain
        this.parent = null;
        // name of node contents, should be unique in folder, like a file name
        this.name = '';
        // node contents can be name of directory or file
        this.content = null;
        // location of node within hd key structure. experiment with saving onchain
        this.keyPath = constants.HD_DERIVATION_PATH;
        // transaction where code is stored in metanet
        this.transactionId = '';
        // child nodes
        this.children = [];
    }
}

export default class constants {
    static WALLET_FILE_NAME = './.thredz'
    static MAX_BYTES_PER_TRANSACTION = 9990000
    static META_PROTOCOL = 'meta'
    // the last index number of the path should increment as nodes added
    // this is path of master/root node
    static META_DERIVATION_PATH = 'm/0'
    //funding path can be static or may increment
    static FUNDING_DERIVATION_PATH = 'm/0/0'
}
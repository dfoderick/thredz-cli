export default class constants {
    // woc, taal, gorilla
    static BROADCASTER = 'gorilla'
    // fee is per broadcast service
    static FEEPERKBNUM = parseInt(process.env.FEEPERKBNUM||'5',10)
    static WALLET_FILE_NAME = './.thredz'
    // testing gorilla > 10MB. worked with 22 MB
    //static MAX_BYTES_PER_TRANSACTION = 99900000
    // bcat should work for most miners
    static MAX_BYTES_PER_TRANSACTION = 9990000
    static META_PROTOCOL = 'meta'
    // the last index number of the path should increment as nodes added
    // this is path of master/root node
    static META_DERIVATION_PATH = 'm/0'
    //funding path can be static or may increment
    static FUNDING_DERIVATION_PATH = 'm/0/0'
    static THREDZ_PROTOCOL = 'thredz'
    static bProtocolTag = '19HxigV4QyBv3tHpQVcUEQyq1pzZVdoAut'
    //https://bcat.bico.media/
    static bcatProtocolTag = '15DHFxWZJT58f9nhyGnsRBqrgwK4W6h4Up'
}

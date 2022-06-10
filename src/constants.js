export default class constants {
}
constants.WALLET_FILE_NAME = './.thredz';
constants.MAX_BYTES_PER_TRANSACTION = 990000;
constants.META_PROTOCOL = 'meta';
// the last index number of the path should increment as nodes added
// this is path of master/root node
constants.META_DERIVATION_PATH = 'm/0';
//funding path can be static or may increment
constants.FUNDING_DERIVATION_PATH = 'm/0/0';

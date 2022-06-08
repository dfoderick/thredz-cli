import OpenSPV from 'openspv';
export class KeyPair {
    get PublicKey() {
        var _a;
        return (_a = this.key) === null || _a === void 0 ? void 0 : _a.toPublic().pubKey;
    }
    get Address() {
        var _a;
        const address = new OpenSPV.Address();
        //pubKey.compressed = false
        address.fromPubKey((_a = this.key) === null || _a === void 0 ? void 0 : _a.toPublic(), 'mainnet');
        return address.toString();
    }
    static fromRandom() {
        const k = new KeyPair();
        k.key = OpenSPV.Bip32.fromRandom();
        return k;
    }
    static fromString(keyString) {
        const k = new KeyPair();
        k.key = OpenSPV.Bip32.fromString(keyString);
        return k;
    }
    toString() { var _a; return (_a = this.key) === null || _a === void 0 ? void 0 : _a.toString(); }
}

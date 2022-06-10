import OpenSPV from 'openspv';
export class KeyPair {
    get PublicKey() {
        var _a;
        return (_a = this.key) === null || _a === void 0 ? void 0 : _a.toPublic().pubKey;
    }
    get PrivateKey() {
        var _a;
        return (_a = this.key) === null || _a === void 0 ? void 0 : _a.privKey;
    }
    get Address() {
        var _a;
        const address = new OpenSPV.Address();
        const pub = (_a = this.key) === null || _a === void 0 ? void 0 : _a.toPublic();
        pub.compressed = false;
        address.fromPubKey(pub, 'mainnet');
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
    //TODO: derived should be a new class?
    //for now, return a KeyPair with new key
    deriveChild(path) {
        const derived = new KeyPair();
        derived.key = this.key.derive(path);
        return derived;
    }
    derive(path) { return this.deriveChild(path); }
    toString() { var _a; return (_a = this.key) === null || _a === void 0 ? void 0 : _a.toString(); }
}

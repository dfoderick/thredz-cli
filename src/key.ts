import OpenSPV from 'openspv'

export class KeyPair {
    key: typeof OpenSPV.Bip32

    get PublicKey() { 
        return this.key?.toPublic().pubKey
    }

    get Address() { 
        const address = new OpenSPV.Address()
        //pubKey.compressed = false
        address.fromPubKey(this.key?.toPublic(), 'mainnet')
        return address.toString()
    }
    static fromRandom() {
        const k = new KeyPair()
        k.key = OpenSPV.Bip32.fromRandom();
        return k
    }
    static fromString(keyString: string) {
        const k = new KeyPair()
        k.key = OpenSPV.Bip32.fromString(keyString);
        return k
    }

    //TODO: derived should be a new class?
    //for now, return a KeyPair with new key
    deriveChild(path: string) {
        const derived = new KeyPair()
        derived.key = this.key.derive(path)
        return derived
    }

    toString() { return this.key?.toString()}
}
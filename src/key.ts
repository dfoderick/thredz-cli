import OpenSPV from 'openspv'

export class KeyPair {
    key: typeof OpenSPV.Bip32

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
    toString() { return this.key?.toString()}
}
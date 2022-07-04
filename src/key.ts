// import OpenSPV from 'openspv'

// export class KeyPair {
//     key: typeof OpenSPV.Bip32

//     get PublicKey(): typeof OpenSPV.PubKey { 
//         return this.key?.toPublic().pubKey
//     }
//     get PrivateKey(): typeof OpenSPV.PrivKey { 
//         return this.key?.privKey
//     }

//     get Address(): typeof OpenSPV.Address { 
//         const address = new OpenSPV.Address()
//         const pub = this.key?.toPublic()
//         pub.compressed = false
//         address.fromPubKey(pub, 'mainnet')
//         return address
//     }
//     static fromRandom() {
//         const k = new KeyPair()
//         k.key = OpenSPV.Bip32.fromRandom();
//         return k
//     }
//     static fromString(keyString: string) {
//         const k = new KeyPair()
//         k.key = OpenSPV.Bip32.fromString(keyString);
//         return k
//     }

//     //TODO: derived should be a new class?
//     //for now, return a KeyPair with new key
//     deriveChild(path: string) {
//         const derived = new KeyPair()
//         derived.key = this.key.derive(path)
//         return derived
//     }
//     derive (path:string) { return this.deriveChild(path) }

//     toString() { return this.key?.toString()}
// }
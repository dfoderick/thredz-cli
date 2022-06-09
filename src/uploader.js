import OpenSPV from 'openspv';
import * as fs from "fs";
import { MetaNode } from "./meta.js";
import constants from "./constants.js";
export class Uploader {
    constructor(wallet, folder) {
        this.bProtocolTag = '';
        this.dipProtocolTag = '';
        this.algorithm = 'SHA512';
        this.wallet = wallet;
        this.folder = folder;
    }
    prepare(fileName) {
        if (!fs.existsSync(fileName))
            return { success: false, result: `File does not exists` };
        const content = fs.readFileSync(fileName);
        const build = this.makeTransaction(fileName, content);
        return { success: false, result: build };
    }
    //TODO
    makeTransaction(fileName, content) {
        console.log(`content`, content.length);
        //TODO: test encrypt and decrypt
        //console.log(`pubkey`, this.wallet.PublicKey)
        const encContent = OpenSPV.Ecies.bitcoreEncrypt(content, this.wallet.PublicKey);
        console.log(`content encrypted`, encContent.length);
        const node = new MetaNode();
        node.name = fileName;
        node.content = content;
        if (content.length > constants.MAX_BYTES_PER_TRANSACTION) {
            throw new Error(`FILE SIZE TOO BIG. USE BCAT`);
        }
        //const script = this.metaScript(null, node)
        //this.folder.commit(content)
        this.folder.commit(Buffer.from(`TODO: this will be a transation\n`));
        return { build: `TODO build transaction` };
    }
    // build script for child node
    metaScript(parent, child) {
        const digest = OpenSPV.Hash.sha512(child.content);
        const encoding = ' ';
        const mediaType = ' ';
        const opr = [
            this.metaPreamble(parent, child),
            this.bProtocolTag,
            child.content,
            mediaType,
            encoding,
            child.name,
            '|',
            this.dipProtocolTag,
            this.algorithm,
            digest,
            0x01,
            0x05
        ];
        return ['OP_RETURN', this.asHex(opr)];
    }
    metaPreamble(parent, child) {
        var _a, _b;
        const derivedKey = (_b = (_a = this.wallet) === null || _a === void 0 ? void 0 : _a.key) === null || _b === void 0 ? void 0 : _b.deriveChild(child.keyPath);
        return ['meta',
            derivedKey.publicKey.toAddress().toString(),
            parent === null ? 'NULL' : parent.transactionId];
    }
    asHex(arr) {
        return arr.map((a) => {
            if (a instanceof Buffer)
                return a.toString('hex');
            //if (typeof a === 'number')
            return Buffer.from(a.toString('hex'));
        });
    }
}

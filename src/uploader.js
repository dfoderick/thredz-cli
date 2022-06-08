import * as fs from "fs";
export class Uploader {
    constructor(wallet) {
        this.wallet = wallet;
    }
    prepare(fileName) {
        if (!fs.existsSync(fileName))
            return { success: false, result: `File does not exists` };
        const content = fs.readFileSync(fileName);
        const build = this.makeTransaction(content);
        return { success: false, result: build };
    }
    makeTransaction(content) {
        console.log(`content`, content.length);
        return { build: `TODO build transaction` };
    }
}

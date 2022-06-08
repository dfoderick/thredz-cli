import * as fs from "fs";
export class Uploader {
    constructor(wallet, folder) {
        this.wallet = wallet;
        this.folder = folder;
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
        //this.folder.commit(content)
        this.folder.commit(Buffer.from(`TODO: this will be a transation\n`));
        return { build: `TODO build transaction` };
    }
}

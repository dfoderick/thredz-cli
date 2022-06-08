import { Wallet } from "./wallet.js";
import { Folder } from "./folder.js"
import * as fs from "fs";

export class Uploader {
    private wallet:Wallet
    private folder:Folder
    constructor(wallet: Wallet, folder: Folder) {
        this.wallet = wallet
        this.folder = folder
    }
    prepare(fileName: string) {
        if (!fs.existsSync(fileName)) return {success: false, result:`File does not exists`}
        const content = fs.readFileSync(fileName)
        const build = this.makeTransaction(content)
        return {success: false, result: build}
    }

    makeTransaction(content: Buffer) {
        console.log(`content`, content.length)
        //this.folder.commit(content)
        this.folder.commit(Buffer.from(`TODO: this will be a transation\n`))
        return {build: `TODO build transaction`}
    }
}
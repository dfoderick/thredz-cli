import { Wallet } from "./wallet.js";
import * as fs from "fs";

export class Uploader {
    private wallet:Wallet
    constructor(wallet: Wallet) {
        this.wallet = wallet
    }
    prepare(fileName: string) {
        if (!fs.existsSync(fileName)) return {success: false, result:`File does not exists`}
        const content = fs.readFileSync(fileName)
        const build = this.makeTransaction(content)
        return {success: false, result: build}
    }

    makeTransaction(content: Buffer) {
        console.log(`content`, content.length)
        return {build: `TODO build transaction`}
    }
}
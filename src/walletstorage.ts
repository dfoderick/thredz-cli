import * as fs from "fs-extra"
import {IStorage} from 'moneystream-wallet'

// file backed storage
export class WalletStorage implements IStorage {
    _filename: string = ''
    constructor(fileName?: string) {
        this.setFileName(fileName||`./.thredz`)
    }
    setFileName(filename: string): void {
        this._filename = filename
    }
    put(item: string): void {
        fs.writeFileSync(this._filename, item)
    }
    get(): string {
        const contents = fs.readFileSync(this._filename)
        return contents.toString()    
}
    tryget(): string | null {
        try {
            const contents = fs.readFileSync(this._filename)
            return contents.toString()    
        } catch (err) {}
        return null
    }
    backup(): void {
        throw new Error('Method not implemented.');
    }
    
}
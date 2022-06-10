import {IStorage} from 'moneystream-wallet'

export class WalletStorage implements IStorage {
    setFileName(filename: string): void {
        throw new Error('Method not implemented.');
    }
    put(item: string): void {
        throw new Error('Method not implemented.');
    }
    get(): string {
        throw new Error('Method not implemented.');
    }
    tryget(): string | null {
        throw new Error('Method not implemented.');
    }
    backup(): void {
        throw new Error('Method not implemented.');
    }
    
}
import 'dotenv/config'
import * as thredz from "thredz-lib"
import { Wallet } from './src/wallet'

console.log(`test`, 'test')

const wallet = Wallet.fromRandom(/*undefined*/)
console.log(`meta wallet`, wallet.AddressMeta)

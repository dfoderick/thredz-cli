import { Wallet } from "./wallet.js";

; (async() => {

const arg1 = process.argv[1]
const arg2 = process.argv[2]
let arg3
let wallet = new Wallet()
wallet = wallet.load()
switch (arg2) {
    case 'init':
        if (wallet?.key) console.log(`thredz ready`)
        else console.log(`There was a problem initializing thredz ${wallet.key}`)
        break;
    case 'fund':
        console.log(`Fund wallet address`, wallet.Address)
        const balance = await wallet.getBalance()
        console.log(`Wallet balance`, balance)
        break;
    case 'user':
        arg3 = process.argv[3]
        console.log(`TODO create user ${arg3}`)
        break;
    case 'mkdir':
        arg3 = process.argv[3]
        console.log(`TODO create directory ${arg3}`)
        break;
    case 'upload':
        console.log(`TODO encrypt and upload file`)
        break;
    case 'status':
        console.log(`TODO show pending changes`)
        break;
    case 'commit':
        console.log(`TODO commit changes`)
        break;
    case 'help':
        console.log(`
        console init (initialize system)
        console user <user> (create user)
        console mkdir <dir> (create folder)
        console upload (upload a file)
        console status (show pending edits)
        console commit (save changes to metanet)
        console help (show help)`)
        break;
    case undefined:
        console.log(`missing argument`, arg1)

}
})()


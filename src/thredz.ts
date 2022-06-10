// import OpenSPV from 'openspv'
// console.log(OpenSPV.PrivKey)
import { Wallet } from "./wallet.js";
import { Uploader } from './uploader.js'
import { Folder } from './folder.js'

; (async() => {

const arg1 = process.argv[1]
const arg2 = process.argv[2]
let arg3
let wallet = new Wallet()
wallet = wallet.load()
const folder = new Folder()
folder.user = wallet.user
const uploader = new Uploader(wallet, folder)
console.log(`Current Directory ${folder.cwd}`)
console.log(`Current User ${wallet.user}[${wallet.AddressMeta}] at ${folder.getuserFolder()}`)
const nameForDomain = `User Folder`
switch (arg2) {
    case 'init':
        if (wallet?.keyMeta) console.log(`thredz ready`)
        else console.log(`There was a problem initializing thredz key ${wallet.keyMeta}`)
        if (wallet?.user) console.log(`thredz user ${wallet?.user}`)
        else console.log(`run 'thredz user <username>' to setup user`)
        break;
    case 'fund':
        console.log(`Fund wallet address`, wallet.AddressFunding.toString())
        // wallet.Address is the HD address
        // use a derivation key for the funding address
        console.log(`[old fund wallet address`, wallet.AddressLegacy,']')
        const balance = await wallet.getBalance(wallet.AddressLegacy)
        console.log(`Wallet balance`, balance)
        break;
    case 'spend':
        arg3 = process.argv[3]
        if (!arg3) throw Error(`spend command needs argument`)
        //const currentbalance = await wallet.getBalance()
        //console.log(`Wallet balance`, currentbalance)
        await uploader.testSpend(arg3)
        break;
    case 'user':
        arg3 = process.argv[3]
        folder.createUser(arg3)
        wallet.user = arg3
        wallet.writeWallet()
        folder.checkCommitsPending()
        break;
    case 'mkdir':
        arg3 = process.argv[3]
        console.log(`TODO create directory ${arg3}`)
        break;
    case 'upload':
        arg3 = process.argv[3]
        const result = await uploader.prepare(arg3)
        console.log(`UPLOAD RESULT`, result)
        if (result.success) folder.checkCommitsPending()
        break;
    case 'status':
        folder.checkCommitsPending()
        break;
    case 'commit':
        if (folder.isPendingCommit()) {
            console.log(`TODO commit changes`)
        } else console.log(`No pending commits`)
        break;
    case 'cancel':
        if (folder.isPendingCommit()) {
            folder.cancel()
            folder.checkCommitsPending()
        } else console.log(`No pending commits`)
        break;
    case 'help':
        console.log(`
        thredz init (initialize system)
        thredz user <user> (create user)
        TODO thredz mkdir <dir> (create folder)
        TODO thredz upload (upload a file)
        thredz status (show pending edits)
        TODO thredz commit (save changes to metanet)
        TODO thredz cancel (delete pending changes)
        thredz help (show help)`)
        break;
    case undefined:
        console.log(`missing argument`, arg2)
    default:
        console.log(`UNKNOWN COMMAND`, arg1, arg2, arg3)
}
})()

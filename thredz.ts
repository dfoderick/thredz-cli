import 'dotenv/config'
import { Wallet } from "./src/wallet";
import { Uploader } from './src/uploader'
import { Folder } from './src/folder'
import { logGreen, startup } from './src/utils'

import Vorpal from "@moleculer/vorpal";
import { wrapTryCatch } from "./src/utils";
import { MetaNode, ContainerNode } from "./src/models/meta";
import { p2p } from "./src/p2p";
import { Indexer } from "./src/indexer";
export const vorpal = new Vorpal();

let wallet = new Wallet()
wallet = wallet.load()
const folder = new Folder()
folder.cd(wallet.user)
const uploader = new Uploader(wallet, folder)
console.log(`Current Directory ${folder.cwd}`)
console.log(`Current User ${wallet.user}[${wallet.AddressMeta}] at ${folder.getuserFolder()}`)
startup()
const nameForDomain = `User Folder`

//swarm
const swarm = new p2p()
swarm.on('data', (data:any) => {
    logGreen(`got message:`, data.toString())    
})

vorpal
    .command('send <message>', 'send a message')
    .action(wrapTryCatch(async ({ message }: { message: string }) => {
        swarm.socket?.write(message)
    }));

vorpal
    .command('init', 'Initializes thredz')
    .action(async () => {
        if (wallet?.keyMeta) vorpal.log(`thredz ready`)
        else vorpal.log(`There was a problem initializing thredz key ${wallet.keyMeta}`)
        if (wallet?.user) console.log(`thredz user ${wallet?.user}`)
        else vorpal.log(`run 'user <username>' to setup user`)    
    });

vorpal
    .command('wallet', 'Shows wallet and funding instructions')
    .action(async () => {
        vorpal.log(`Fund wallet address`, wallet.AddressFunding.toString())
        // wallet.Address is the HD address
        // use a derivation key for the funding address
        vorpal.log(`[old fund wallet address`, wallet.AddressLegacy,']')
        const balance = await wallet.getBalance(wallet.AddressLegacy)
        vorpal.log(`Wallet balance`, balance)    
    });

vorpal
    .command('user <name>', 'creates a user folder')
    .action(wrapTryCatch(async ({ name }: { name: string }) => {
        const alreadyExists = folder.createUser(name)
        if (!alreadyExists) {
            const root: ContainerNode = folder.mkdir()
            const script = uploader.metaScript(root)
            console.log(root)
            root.script = script
            const metanetNodeBuilt = await uploader.createTransaction(root)
            console.log(metanetNodeBuilt)
            if (script) folder.stageWork(metanetNodeBuilt)
        }
        wallet.user = name
        wallet.writeWallet()
        folder.checkCommitsPending()
    }));

vorpal
    .command('spend <address>', 'sends payment to address')
    .action(wrapTryCatch(async ({ address }: { address: string }) => {
        //const currentbalance = await wallet.getBalance()
        //console.log(`Wallet balance`, currentbalance)
        await uploader.testSpend(address)
    }));

vorpal
    .command('commit', 'writes pending commits to metanet')
    .action(async () => {
        if (folder.isPendingCommit()) {
            const result = await uploader.commit()
            console.log(`published ${result?.length} commits`)
            folder.checkCommitsPending()
        } else console.log(`No pending commits`)
    });

vorpal
    .command('cancel', 'Deletes pending commits')
    .action(async () => {
        if (folder.isPendingCommit()) {
            folder.cancel()
            folder.checkCommitsPending()
        } else console.log(`No pending commits`)
    });

    vorpal
    .command('status', 'shows pending commits')
    .option("-d, --details", "detail output")
    .action(wrapTryCatch(async ({ options }: any) => {
        folder.checkCommitsPending(options.details?true:false)
    }));

vorpal
    .command('upload <filename>', 'upload a file to metanet')
    .action(wrapTryCatch(async ({ filename }: { filename: string }) => {
        const result = await uploader.prepare(filename)
        console.log(`UPLOAD RESULT`, result.success)
        if (result.success) folder.checkCommitsPending()
    }));
    
vorpal
    .command('mkdir <name>', 'create a directory/folder')
    .action(wrapTryCatch(async ({ name }: { name: string }) => {
        const parent = folder.currentNode
        const newNode = folder.mkdir(name)
        //TODO: find the node with parent intact
        newNode.parent = parent
        const script = uploader.metaScript(newNode)
        console.log(newNode)
        //TODO: refactor to buildandstage
        newNode.script = script
        const metanetNodeBuilt = await uploader.createTransaction(newNode)
        console.log(metanetNodeBuilt)
        // TODO: transaction was created in parent, not subfolder
        if (script) folder.stageWork(metanetNodeBuilt)

    }));
vorpal
    .command('cd <dir>', 'change directory')
    .action(wrapTryCatch(async ({ dir }: { dir: string }) => {
        folder.cd(dir)
    }));
    
vorpal
    .command('ls', 'show files and objects in a folder')
    .action(wrapTryCatch( () => {
        folder.ls()
    }));

vorpal
    .command('tree', 'show current and child folders')
    .action(wrapTryCatch(() => {
        folder.tree()
    }));

vorpal
    .command('val', 'validate folder structure')
    .action(wrapTryCatch(() => {
        folder.validate()
    }));

vorpal
    .command('backup', 'backup users folder')
    .action(wrapTryCatch(() => {
        folder.backup()
    }));

vorpal
    .command('traverse', 'test traversal through folder tree')
    .action(wrapTryCatch(() => {
        const results = folder.traverse(undefined, undefined, (f:any) => {
            console.log(`traverse`, f)
        })
        //console.log(results)
    }));

vorpal
    .command('node <filename> <contents>', 'create a node with contents')
    .action(wrapTryCatch(async ({ filename, contents }: { filename: string, contents:string }) => {
        const node = await uploader.createTextNode(filename, contents)
    }));

vorpal
    .command('clone', 'download metanet hierarchy')
    .option('-t','transaction id')
    .action(wrapTryCatch(async ({ options }: any) => {
        //get root transaction
        // const tx = await uploader.indexService.getApiTxJSON(options.t||'f986f16eaf6a853ec4eee41955074713cc49a2e476433ce6fdc6ae9c11f0c3a1')
        // //console.log(tx)
        // // asm, hex
        // console.log(tx.vout[0].scriptPubKey)
        // //type:metanet
        // console.log(tx.vout[0].scriptPubKey.opReturn)

        // console.log(`options`, options)
        const indexer = new Indexer()
        const history = await indexer.history()
        console.log(history)
    }));

    vorpal
    .command('metanet', 'recent metanet history')
    .option('-t','transaction id')
    .action(wrapTryCatch(async ({ options }: any) => {
        const indexer = new Indexer()
        const metanet = await indexer.metanet()
        console.log(metanet)
    }));

vorpal
  .delimiter(`thredz$\\\\${folder.currentPath}\\`)
  .show();
